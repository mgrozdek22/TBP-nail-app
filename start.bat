@echo off
echo --- Priprema projekta i .env datoteka ---

:: Putanje do datoteka
set "BACKEND_ENV=backend\.env"
set "ROOT_ENV=.env"

:: 1. Provjera i kreiranje backend/.env
if not exist "%BACKEND_ENV%" (
    echo Kreiram %BACKEND_ENV%...
    echo PORT=3001> "%BACKEND_ENV%"
    echo.>> "%BACKEND_ENV%"
    echo DB_HOST=localhost>> "%BACKEND_ENV%"
    echo DB_PORT=5434>> "%BACKEND_ENV%"
    echo DB_NAME=nail_tehnicarke10>> "%BACKEND_ENV%"
    echo DB_USER=postgres>> "%BACKEND_ENV%"
    echo DB_PASSWORD=marija>> "%BACKEND_ENV%"
) else (
    echo %BACKEND_ENV% vec postoji.
)

:: 2. Provjera i kreiranje root/.env
if not exist "%ROOT_ENV%" (
    echo Kreiram %ROOT_ENV%...
    echo PORT=3001> "%ROOT_ENV%"
    echo.>> "%ROOT_ENV%"
    echo DB_HOST=localhost>> "%ROOT_ENV%"
    echo DB_PORT=5434>> "%ROOT_ENV%"
    echo DB_NAME=nail_tehnicarke10>> "%ROOT_ENV%"
    echo DB_USER=postgres>> "%ROOT_ENV%"
    echo DB_PASSWORD=marija>> "%ROOT_ENV%"
)

:: 3. Instalacija paketa
echo.
echo Instaliram backend pakete...
cd backend
call npm install --quiet
cd ..

:: 4. Pokretanje servera u pozadini
echo.
echo Pokrecem servere nevidljivo (u pozadini)...
start /b node backend/server.js
start /b node frontend/static-server.js

:: 5. Otvaranje browsera
echo Otvaram aplikaciju u browseru...
timeout /t 2 >nul
start http://localhost:8000

echo.
echo === SVE JE POKRENUTO ===
echo Serveri rade u pozadini. Mozes zatvoriti ovaj prozor.
echo.
pause