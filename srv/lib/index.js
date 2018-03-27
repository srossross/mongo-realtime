import { createServer } from 'http';
import engine from 'engine.io';

import app from './auth';
import { getClient, getRTClient } from './db';
import presence from './presence';
import Perms from './perms';
import { PORT, MONGO_USER_DB } from './defaults';
import connections from './connections';

const { log } = console;
const debug = require('debug')('mongo-realtime:server');

const dbName = 'web';

module.exports = async function main() {
  const server = new engine.Server();

  const perms = await Perms.fromYaml(process.env.PERMS_FILE || 'permissions.yaml');

  const client = await getClient();
  const rtclient = await getRTClient();

  const userDB = client.db(MONGO_USER_DB);

  const users = await presence.startWatching(userDB);

  log(`server listening on port ${PORT}`);

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
