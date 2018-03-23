import BSON from 'bson';

import PermissionError from './errors';
import Perms from './perms';

const bson = new BSON();
const debug = require('debug')('mongo-realtime:connection');


class Connection {
  constructor(perms, user, db, socket, rt) {
    this.user = user;
    this.rt = rt;
    this.db = db;
    this.socket = socket;
    this.perms = perms;
    this.watching = new Set();
    socket.on('message', data => this.message(bson.deserialize(data)));
    socket.on('close', () => this.unwatchAll());
  }

  unwatchAll() {
    this.watching.forEach((handle) => {
      this.rt.unwatch(handle);
      debug(`Unwatch ${handle}`);
    });
  }

  send(requestID, err, result) {
    let error = null;
    if (err) {
      error = err.toString();
    }
    this.socket.send(bson.serialize({ requestID, result, error }));
  }

  insertOne(collection, doc) {
    return this.db.collection(collection).insertOne(doc);
  }

  findOne(collection, query) {
    return this.db.collection(collection).findOne(query);
  }

  find(collection, query) {
    return this.db.collection(collection).find(query).toArray();
  }

  count(collection, query) {
    return this.db.collection(collection).find(query).count();
  }


  async updateOne(collection, query, update) {
    const res = await this.db.collection(collection).updateOne(query, update);
    const { result } = res;
    const { nModified, ok } = result;
    return { nModified, ok };
  }

  async updateMany(collection, query, update) {
    const res = await this.db.collection(collection).updateMany(query, update);
    const { result } = res;
    const { nModified, ok } = result;
    return { nModified, ok };
  }

  // watchID(collection, requestID, query) {
  //   const handle = this.rt.watchQuery(collection, query, (op, doc) => {
  //
  //   });
  //   this.watching.add(handle);
  //   return { handle };
  // }

  watchQuery(collection, requestID, query) {
    const handle = this.rt.watchQuery(collection, query, (op, doc) => {
      debug(`Update watcher ${handle} with op:${op} id:${doc._id}`);
      this.socket.send(bson.serialize({ requestID, op, doc }));
    });
    this.watching.add(handle);
    return { handle };
  }
  unwatch(handle) {
    this.rt.unwatch(handle);
    this.watching.delete(handle);
  }

  generateQueryParams(collection, queryRule, query) {
    if (!queryRule.valid()) {
      throw new PermissionError(`User ${this.user.username} can not query collection ${collection}`);
    }

    if (typeof query !== 'object') {
      throw new PermissionError(`QueryEEE must be object (got ${typeof query})`);
    }

    const ruleResult = queryRule.result();
    if (!ruleResult) {
      throw new PermissionError(`User ${this.user.username} can not query collection ${collection}`);
    }
    if (ruleResult === true) {
      return query; // eslint-disable-line prefer-destructuring
    }
    return { $and: [ruleResult, query] };
  }

  generateUpdateParams(collection, rule, update) {
    if (!rule.valid()) {
      throw new PermissionError(`User ${this.user.username} can not update in collection ${collection}`);
    }
    if (!update) {
      throw new PermissionError('Parameter `update` is required');
    }
    const ruleResult = rule.result({ update });

    if (!ruleResult) {
      throw new PermissionError(`User ${this.user.username} can not update in collection ${collection}`);
    }

    return update;
  }
  generateInsertParams(collection, rule, doc) {
    if (!rule.valid()) {
      throw new PermissionError(`User ${this.user.username} can not insert into collection ${collection}`);
    }
    if (!doc) {
      throw new PermissionError('Parameter `doc` is required');
    }

    const ruleResult = rule.result({ doc });
    if (!ruleResult) {
      throw new PermissionError(`User ${this.user.username} can not insert into collection ${collection}`);
    }

    return doc;
  }

  generateParams(collection, op, data) {
    const rules = this.perms.rules(collection, this.user);

    const query = Perms.hasQuery(op)
      ? this.generateQueryParams(collection, rules.query, data.query) : undefined;

    const update = Perms.hasUpdate(op)
      ? this.generateUpdateParams(collection, rules.update, data.update) : undefined;

    const doc = Perms.hasUpdate(op)
      ? this.generateInsertParams(collection, rules.insert, data.doc) : undefined;

    return { query, update, doc };
  }

  async performOperation(collection, op, query, doc, update, data) {
    let result;
    switch (op) {
      case 'insertOne':
        result = await this.insertOne(collection, doc);
        break;
      case 'updateOne':
        result = await this.updateOne(collection, query, update);
        break;
      case 'updateMany':
        result = await this.updateMany(collection, query, update);
        break;
      case 'findOne':
        result = await this.findOne(collection, query);
        break;
      case 'find':
        result = await this.find(collection, query);
        break;
      case 'count':
        result = await this.count(collection, query);
        break;
      case 'watchID':
        result = await this.watchID(collection, data.requestID, query);
        break;
      case 'watchQuery':
        result = await this.watchQuery(collection, data.requestID, query);
        break;
      case 'unwatch':
        result = await this.unwatch(data.handle);
        break;
      default:
        throw new PermissionError(`Unsupported operation ${op}`);
    }
    return result;
  }

  async message(data) {
    const { requestID, collection, op } = data;
    debug(`Recieved message: user:${this.user.username} wants to ${op} in ${collection}`);

    let result;
    try {
      const { query, doc, update } = this.generateParams(collection, op, data);
      result = await this.performOperation(collection, op, query, doc, update, data);
    } catch (err) {
      debug(err.message);
      if (err.isUserError) {
        this.socket.send(bson.serialize({ requestID, error: err.message }));
      } else {
        console.error(err);
        this.socket.send(bson.serialize({ requestID, error: 'ServerError' }));
      }
      return;
    }

    this.socket.send(bson.serialize({ requestID, result }));
  }
}

export default (...args) => new Connection(...args);
