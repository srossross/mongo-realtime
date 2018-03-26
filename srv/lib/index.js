import { createServer } from 'http';

import app from './auth';
import { getClient, getRTClient } from './db';
import Users from './users';
import Perms from './perms';
import { PORT } from './defaults';
import connections from './connections';

const engine = require('engine.io');
const yaml = require('node-yaml');
const debug = require('debug')('mongo-realtime:server');

const dbName = 'web';

module.exports = async function main() {
  const server = new engine.Server();

  // const permData = await yaml.read('./permissions.yaml');
  const permData = {
    cln1: {
      query: true,
      insert: true,
      update: true,
      remove: false,
    },
    items: {
      query: '{userId: user._id}',
      remove: '{userId: user._id}',
      insert: 'user && user._id.equals(doc.userId)',
      update: false,
    },
  };
  const perms = new Perms(permData);
  // Database Name
  // Connect using MongoClient
  const client = await getClient();
  const rtclient = await getRTClient();

  const userDB = client.db('users');
  const users = new Users(userDB);
  await users.watch();

  // eslint-disable-next-line no-console
  console.log(`server listening on port ${PORT}`);

  const rt = rtclient.db('web');

  server.on('connection', connections(client, perms, client.db(dbName), rt));

  const httpServer = createServer();
  httpServer.on('upgrade', (req, socket, head) => {
    debug('upgrade', req.method, req.url);
    server.handleUpgrade(req, socket, head);
  });

  httpServer.on('request', (req, res) => {
    debug('handleRequest', req.method, req.url);
    if (req.url.match(/^\/engine.io/)) {
      server.handleRequest(req, res);
    } else {
      app(req, res);
    }
  });

  httpServer.listen(PORT);
};
