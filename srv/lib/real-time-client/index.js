/* eslint-disable no-underscore-dangle */

import { ObjectId } from 'bson';

import oplog from './oplog';
import QuerySubscription from './sub';
import MongoRealTimeDb from './db';

const debug = require('debug')('mongo-realtime:rt');


function findOneWithId(client, ns, query, documentId) {
  const scopedQuery = Object.assign({}, query, { _id: documentId });
  const [dbName, collectionName] = ns.split('.', 2);
  return client.db(dbName).collection(collectionName).findOne(scopedQuery);
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
      querySubs.forEach(sub => this.handleSub(sub, op, documentId, o, ns));
    }
  }

  handleSub(sub, op, documentId, o, ns) {
    switch (op) {
      case 'd': {
        sub.queueNext(async () => {
          if (sub.querySet[documentId]) {
            sub.remove(documentId);
            sub.callback(op, o);
          }
        });
        break;
      }
      default: {
        sub.queueNext(async () => {
          const doc = await findOneWithId(this.client, ns, sub.query, documentId);

          if (sub.querySet[documentId] && doc === null) {
            sub.remove(documentId);
            sub.callback('d', o);
          } else if (!sub.querySet[documentId] && doc !== null) {
            sub.add(documentId);
            sub.callback('i', doc);
          } else if (sub.querySet[documentId] && doc !== null) {
            sub.callback('u', doc);
          }
        });
      }
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

  watchQuery(dbName, clnName, query, options, callback) {
    if (callback === null) {
      // eslint-disable-next-line no-param-reassign
      callback = options;
    }
    const ns = `${dbName}.${clnName}`;
    if (!this.querySubscriptions[ns]) {
      this.querySubscriptions[ns] = [];
    }
    const qid = ObjectId();

    const sub = new QuerySubscription(qid, query, options, callback);
    this.querySubscriptions[ns][qid] = sub;

    sub.queueNext(async () => new Promise((resolve, reject) =>
      this.client.db(dbName).collection(clnName)
        .find(query).project({ _id: 1 })
        .forEach(
          (doc) => { sub.querySet[doc._id] = true; },
          (err) => {
            if (err) reject(err);
            resolve();
          },
        )));
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
