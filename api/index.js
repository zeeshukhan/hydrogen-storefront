export const config = { runtime: 'edge' };
import server from '../server.js';

export default async function handler(request, context) {
  return server.fetch(request, process.env, context);
}


