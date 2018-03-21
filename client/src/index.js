const BSON = require('bson');
const engine = require('engine.io-client');
const EventEmitter = require('events');

const { Ref } = require('./ref');

const bson = new BSON();

const debug = require('debug')('mongo-realtime:client');

class MongoWebCollection {
  constructor(db, collection) {
    this.db = db;
    this.collection = collection;
  }

  insertOne(doc) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'insertOne',
      doc,
    });
  }

  updateOne(query, doc) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'updateOne',
      query,
      doc,
    });
  }

  findOne(query, callback) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'findOne',
      query,
    }, callback);
  }

  find(query, callback) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'find',
      query,
    }, callback);
  }

  ref(IdOrQuery) {
    return new Ref(this.db, this.collection, IdOrQuery);
  }

  unwatch(requestID) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'unwatch',
      requestID,
    });
  }
}

class MongoWebDB extends EventEmitter {
  constructor(url) {
    super();
    this.socket = engine(url);
    const { socket } = this;

    this.requestID = 0;
    socket.on('error', (err) => {
      throw err;
    });

    this.CONNECTION_STATE = 'initialize';

    socket.once('open', () => { this.CONNECTION_STATE = 'open'; });
    socket.on('message', data => this.handleMessage(data));
  }

  close() {
    this.socket.close();
  }

  collection(name) {
    return new MongoWebCollection(this, name);
  }

  handleMessage(buf) {
    const data = bson.deserialize(buf);
    this.emit(`message/${data.requestID}`, data);
  }

  executeCommand(cmd, callback) {
    const req = Object.assign({
      requestID: this.requestID += 1,
    }, cmd);
    debug(`Execute command (id:${req.requestID})`, cmd);

    this.socket.send(bson.serialize(req));

    const promise = new Promise((resolve, reject) => {
      this.once(`message/${req.requestID}`, (data) => {
        debug(`Command result (id:${data.requestID})`);
        if (callback) {
          callback(data.error, data.result, req.requestID);
        }
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.result);
        }
      });
    });

    promise.requestID = req.requestID;
    return promise;
  }

  login(data, callback) {
    const doLogin = () => {
      this.executeCommand({
        op: 'login',
        data,
      });
      this.CONNECTION_STATE = 'logged in';
      if (callback) { callback(); }
    };

    if (this.CONNECTION_STATE === 'open') {
      doLogin();
    } else if (this.CONNECTION_STATE === 'initialize') {
      this.socket.once('open', doLogin);
    } else {
      throw new Error(`can not login when connection state is ${this.CONNECTION_STATE}`);
    }
  }
}

module.exports = MongoWebDB;
