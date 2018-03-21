/* eslint-disable no-underscore-dangle */

import { ObjectId } from 'bson';

import oplog from './oplog';

const debug = require('debug')('mongo-realtime:rt');

class QuerySubscription {
  constructor(qid, query, callback) {
    this.qid = qid;
    this.query = query;
    this.callback = callback;
    this.querySet = {};
    this.pending = [];
  }
  add(id) {
    this.querySet[id] = true;
  }

  remove(id) {
    delete this.querySet[id];
  }

  queueNext(next) {
    const callback = () => {
      next(() => {
        // const should_be_me = this.pending.shift();
        this.pending.shift();
        if (this.pending.length) {
          this.pending[0]();
        }
      });
    };
    this.pending.push(callback);
    if (this.pending.length === 1) {
      this.pending[0]();
    }
  }
}

function findOneWithId(client, ns, query, documentId, cb) {
  const scopedQuery = Object.assign({}, query, { _id: documentId });
  const [dbName, collectionName] = ns.split('.', 2);
  client.db(dbName).collection(collectionName).findOne(scopedQuery, cb);
}

class MongoRealTimeDb {
  constructor(client, dbName) {
    this.client = client;
    this.dbName = dbName;
  }

  watchID(clnName, id, callback) {
    return this.client.watchID(this.dbName, clnName, id, callback);
  }

  watchQuery(clnName, query, callback) {
    return this.client.watchQuery(this.dbName, clnName, query, callback);
  }

  unwatch(handle) {
    return this.client.unwatch(handle);
  }
}

export default class MongoRealTimeClient {
  static async connect(client) {
    return new MongoRealTimeClient(client, await oplog(client));
  }

  constructor(client, oplogStream) {
    this.client = client;
    this.oplogStream = oplogStream;
    debug('listening to oplog data stream');
    this.oplogStream.on('data', data => this.handleData(data));
    this.watching = {};
    this.querySubscriptions = {};
  }

  db(name) {
    return new MongoRealTimeDb(this, name);
  }

  handleData(data) {
    // console.log('handleData', data);

    const {
      op, o, o2, ns,
    } = data;

    const documentId = (o2 || o)._id;

    if (this.watching[ns]) {
      Object.values(this.watching[ns][documentId]).forEach((callback) => {
        callback(op, o);
      });
    }

    if (this.querySubscriptions[ns]) {
      const querySubs = Object.values(this.querySubscriptions[ns]);
      querySubs.forEach((sub) => {
        switch (op) {
          case 'd': {
            sub.queueNext((done) => {
              if (sub.querySet[documentId]) {
                sub.remove(documentId);
                sub.callback(op, o);
                done();
              }
            });
            break;
          }
          default: {
            sub.queueNext((done) => {
              findOneWithId(this.client, ns, sub.query, documentId, (err, doc) => {
                if (err) {
                  sub.callback('error', err);
                  return;
                }

                if (sub.querySet[documentId] && doc === null) {
                  sub.remove(documentId);
                  sub.callback('d', o);
                } else if (!sub.querySet[documentId] && doc !== null) {
                  sub.add(documentId);
                  sub.callback('i', doc);
                } else if (sub.querySet[documentId] && doc !== null) {
                  sub.callback('u', doc);
                }
                done();
              });
            });
          }
        }
      });
    }
  }

  watchID(dbName, clnName, id, callback) {
    const qid = ObjectId();
    const ns = `${dbName}.${clnName}`;
    if (!this.watching[ns]) {
      this.watching[ns] = {};
    }
    if (!this.watching[ns][id]) {
      this.watching[ns][id] = {};
    }
    this.watching[ns][id][qid] = callback;
    return `id::${ns}::${id}::${qid}`;
  }

  watchQuery(dbName, clnName, query, callback) {
    const ns = `${dbName}.${clnName}`;
    if (!this.querySubscriptions[ns]) {
      this.querySubscriptions[ns] = [];
    }
    const qid = ObjectId();

    const sub = new QuerySubscription(qid, query, callback);
    this.querySubscriptions[ns][qid] = sub;

    sub.queueNext((done) => {
      this.client.db(dbName).collection(clnName)
        .find(query).project({ _id: 1 })
        .forEach(
          (doc) => { sub.querySet[doc._id] = true; },
          (err) => {
            if (err) callback('error', err);
            done();
          },
        );
    });
    return `query::${ns}::${qid}`;
  }

  unwatch(handle) {
    const [tag, ...path] = handle.split('::');
    if (tag === 'id') {
      const [ns, did, qid] = path;
      delete this.watching[ns][did][qid];
    } else if (tag === 'query') {
      const [ns, qid] = path;
      delete this.querySubscriptions[ns][qid];
    }
  }
}
