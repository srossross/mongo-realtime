import BSON from 'bson';

const bson = new BSON();

const debug = require('debug')('mongo-realtime:presence');


const { error } = console;

export default class Presence {
  constructor(userDB) {
    this.userDB = userDB;
    this.users = [];
  }

  async waitForLogin(socket) {
    const data = await new Promise((resolve) => {
      const listener = (msg) => {
        const object = bson.deserialize(msg);
        if (object.op === 'login') {
          debug('User trying to log in', object.data);
          socket.removeListener('message', listener);
          resolve(object.data);
        }
      };
      socket.on('message', listener);
    });

    socket.once('close', () => {
      debug(`socket close for ${data.username}`);
      this.userDB.collection('users').updateOne(
        { username: data.username },
        { $set: { connected: false } },
        { upsert: true },
      );
    });

    debug(`socket open for ${data.username}`);
    const { value } = await this.userDB.collection('users').findOneAndUpdate(
      { username: data.username },
      { $set: { connected: true } },
      { upsert: true, returnOriginal: false },
    );
    return value;
  }


  /* eslint-disable class-methods-use-this */
  update(key, isConnected) {
    // TODO: implement me
    debug(`update presence ${key} isConnected:${isConnected}`);
  }

  static async startWatching(userDB) {
    const presence = new Presence(userDB);

    await userDB.createCollection('users');
    const changeStream = userDB.collection('users').watch();
    changeStream.on('change', (change) => {
      switch (change.operationType) {
        case 'update': {
          const { connected } = change.updateDescription.updatedFields;
          if (connected !== undefined) {
            presence.update(change.documentKey._id, connected);
          }
          break;
        }
        case 'insert': {
          presence.update(change.documentKey._id, true);
          break;
        }
        default:
          debug(`Unknown change.operationType ${change.operationType}`);
          break;
      }
    });

    changeStream.on('error', (err) => {
      error('change err', err);
    });
    changeStream.on('close', () => {
      error('change close');
    });
    changeStream.on('end', () => {
      error('change end');
    });

    return presence;
  }
}
