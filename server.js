const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;
const API_BASE = 'https://geomos.geoinfo.ch';

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);

    // Proxy API requests
    if (parsedUrl.pathname.startsWith('/api/')) {
        const apiPath = parsedUrl.pathname.replace('/api', '');
        const targetUrl = `${API_BASE}${apiPath}${parsedUrl.search || ''}`;

        console.log(`Proxying: ${targetUrl}`);

        https.get(targetUrl, (apiRes) => {
            res.writeHead(apiRes.statusCode, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            apiRes.pipe(res);
        }).on('error', (err) => {
            console.error('Proxy error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Proxy error' }));
        });
    }
    // Serve index.html
    else if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html') {
        const fs = require('fs');
        fs.readFile('./index.html', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    }
    else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`API proxy available at http://localhost:${PORT}/api/...`);
});
