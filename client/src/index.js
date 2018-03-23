const fetch = require('node-fetch');
const BSON = require('bson');
const engine = require('engine.io-client');
const EventEmitter = require('events');

const MongoWebCollection = require('./collection');


const bson = new BSON();

const debug = require('debug')('mongo-realtime:client');


class MongoWebDB extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
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

  login(data) {
    return fetch(`http://${this.url}/login`, {
      body: JSON.stringify(data), // must match 'Content-Type' header
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, same-origin, *omit
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, cors, *same-origin
      redirect: 'error', // *manual, follow, error
      referrer: 'no-referrer', // *client, no-referrer
    })
      .then(res => res.json())
      .then(body => this.executeCommand({
        op: 'login',
        token: body.token,
      }));
  }
}

module.exports = MongoWebDB;
