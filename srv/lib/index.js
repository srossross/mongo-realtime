import { MongoClient } from 'mongodb';

import Users from './users';
import Perms from './perms';
import { MONGO_URL, MONGO_OPTIONS, PORT } from './defaults';
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

  const userDB = client.db('users');
  const users = new Users(userDB);
  await users.watch();

  console.log(`server listening on port ${PORT}`);

  server.on('connection', async (socket) => {
    debug('Client Connected');
    const user = await users.waitForLogin(socket);
    debug(`User ${user.username} logged in`);
    connection(perms, user, client.db(dbName), socket);
  });
};
