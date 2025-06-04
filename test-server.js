const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Test Server Running!</h1><p>If you can see this, the basic server works.</p>');
});

server.listen(8080, '127.0.0.1', () => {
  console.log('Simple test server running on http://localhost:8080');
});