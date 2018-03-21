import { MongoClient } from 'mongodb';

import Users from './users';
import Perms from './perms';
import { MONGO_URL, MONGO_OPTIONS, PORT } from './defaults';
import MongoRealTimeClient from './real-time-client';
import connection from './connection';

const engine = require('engine.io');
const yaml = require('node-yaml');
const debug = require('debug')('mongo-realtime:server');

const dbName = 'web';


module.exports = async function main() {
  const server = engine.listen(PORT);

  const permData = await yaml.read('./permissions.yaml');
  const perms = new Perms(permData);
  // Database Name
  // Connect using MongoClient
  const client = await MongoClient.connect(MONGO_URL, MONGO_OPTIONS);
  debug(`Connected to mongo @ ${MONGO_URL}`);
  const rtclient = await MongoRealTimeClient.connect(client);

  const userDB = client.db('users');
  const users = new Users(userDB);
  await users.watch();

  // eslint-disable-next-line no-console
  console.log(`server listening on port ${PORT}`);

  const rt = rtclient.db('web');
  server.on('connection', async (socket) => {
    debug('Client Connected');
    const user = await users.waitForLogin(socket);
    debug(`User ${user.username} logged in`);
    connection(perms, user, client.db(dbName), socket, rt);
  });
};
