## Preduvjeti

Prije pokretanja aplikacije potrebno je imati instalirano:

- PostgreSQL 
- PostGIS ekstenziju za PostgreSQL
- Node.js 
- DBeaver (ili drugi alat za rad s bazom podataka)

## Postavljanje baze podataka

1. Pokrenuti PostgreSQL server
2. U DBeaveru (ili drugom alatu) kreirati novu bazu podataka
3. U bazu ručno importati SQL skriptu koja se nalazi u projektu 
4. Provjeriti da su ekstenzije postgis i btree_gist dodane

## Pokretanje instalacijske skripte

U root direktoriju projekta nalazi se instalacijska skripta start.bat te ju treba pokrenuti sa naredbom .\start.bat u terminalu

## Konfiguracija pristupa bazi (po potrebi)

Ako se aplikacija ne poveže s bazom:

Treba otvoriti novokreirane datoteke:
   - backend/.env
   - .env
I provjeriti i po potrebi prilagoditi sljedeće vrijednosti:
   - DB_HOST
   - DB_PORT
   - DB_NAME
   - DB_USER
   - DB_PASSWORD
Onda spremiti promjene i ponovno pokrenuti start.bat i aplikacija se sama otvara.

U aplikaciji postoje dvije uloge:
  - korisnik– može dodavati recenzije, prijedloge i koristiti preporuke
  - moderator– može odobravati ili odbijati unesene podatke

Testni korisnici i podaci već su uključeni u bazu kroz SQL skriptu.
