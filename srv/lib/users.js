import BSON from 'bson';

const bson = new BSON();

const debug = require('debug')('mongo-realtime:presense');

export default class Users {
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


  updatePresense(key, isConnected) {
    debug(`updatePresense ${key} isConnected:${isConnected}`);
  }

  async watch() {
    await this.userDB.createCollection('users');
    const changeStream = this.userDB.collection('users').watch();
    changeStream.on('change', (change) => {
      switch (change.operationType) {
        case 'update': {
          const { connected } = change.updateDescription.updatedFields;
          if (connected !== undefined) {
            this.updatePresense(change.documentKey._id, connected);
          }
          break;
        }
        case 'insert': {
          this.updatePresense(change.documentKey._id, true);
          break;
        }
        default:
          console.log('unknown change.operationType', change.operationType);
          break;
      }
    });

    changeStream.on('error', (err) => {
      console.log('change err', err);
    });
    changeStream.on('close', () => {
      console.log('change close');
    });
    changeStream.on('end', () => {
      console.log('change end');
    });
  }
}
