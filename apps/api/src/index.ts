import { createServer } from 'node:http';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

/**
 * Minimal HTTP stub — replaced by Fastify in BLOCK-05.
 */
const server = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message: 'HiveMind API stub' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`HiveMind API stub listening on http://0.0.0.0:${PORT}`);
});
