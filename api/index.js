import server from '../server.js';
import {Readable} from 'node:stream';

export default async function handler(req, res) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const url = `${protocol}://${host}${req.url}`;

    const requestInit = {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Readable.toWeb(req),
      // Let fetch handle streaming bodies in Node 20
      duplex: 'half',
    };

    const request = new Request(url, requestInit);

    const executionContext = { waitUntil: () => {} };
    const response = await server.fetch(request, process.env, executionContext);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      // Node's res.setHeader expects strings or string[]
      res.setHeader(key, value);
    });

    if (!response.body) {
      res.end();
      return;
    }

    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);
  } catch (error) {
    // Fallback on unexpected errors
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain');
    res.end('Internal Server Error');
  }
}


