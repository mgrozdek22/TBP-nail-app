const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
};

const server = http.createServer((req, res) => {

    let filePath = req.url === '/' ? './login.html' : '.' + req.url;
    
    filePath = filePath.split('?')[0];

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(path.join(__dirname, filePath), (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Greška 404: Datoteka nije pronađena');
            } else {
                res.writeHead(500);
                res.end('Greška na serveru: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`FRONTEND SERVER pokrenut na: http://localhost:${PORT}`);
    console.log(`Prvo otvori: http://localhost:${PORT}/login.html`);
    console.log(`-----------------------------------------`);
});