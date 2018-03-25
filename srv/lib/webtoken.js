import jwt from 'jsonwebtoken';
import NodeRSA from 'node-rsa';

import { PRIVATE_KEY } from './defaults';

const privateKey = Buffer.from(PRIVATE_KEY, 'base64').toString();

const pk = NodeRSA(privateKey);
const publicKey = pk.exportKey('public');

export async function verify(token, options = {}) {
  const opts = Object.assign({}, options, { algorithms: ['RS256'] });
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      publicKey,
      opts,
      (err, payload) => { if (err) reject(err); else resolve(payload); },
    );
  });
}

export function sign(data, options = {}) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      data,
      privateKey,
      Object.assign({}, options, { algorithm: 'RS256' }),
      (err, token) => { if (err) reject(err); else resolve(token); },
    );
  });
}

// Test Private key
const token = jwt.sign(
  { hello: 'world' },
  privateKey,
  { algorithm: 'RS256' },
);
jwt.verify(
  token,
  publicKey,
  { algorithms: ['RS256'] },
);
