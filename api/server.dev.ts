import 'dotenv/config';
import http, { IncomingMessage, ServerResponse } from 'node:http';
import handler from './contact';

const PORT = 3002;

function createMockRes(res: ServerResponse) {
  let code = 200;
  const pending: Record<string, string> = {};

  const mock = {
    setHeader(key: string, value: string) {
      pending[key] = value;
      res.setHeader(key, value);
      return mock;
    },
    status(statusCode: number) {
      code = statusCode;
      return mock;
    },
    json(data: unknown) {
      if (!res.headersSent) {
        res.writeHead(code, { 'Content-Type': 'application/json', ...pending });
      }
      res.end(JSON.stringify(data));
      return mock;
    },
    end() {
      if (!res.headersSent) res.writeHead(code, pending);
      res.end();
      return mock;
    },
  };
  return mock;
}

const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  let body = '';
  req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
  req.on('end', async () => {
    const mockReq = {
      method: req.method ?? 'GET',
      headers: req.headers,
      url: req.url,
      body: body ? JSON.parse(body) : {},
    };

    try {
      await handler(mockReq as never, createMockRes(res) as never);
    } catch (err) {
      console.error('[API dev]', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[API dev] http://localhost:${PORT}`);
});
