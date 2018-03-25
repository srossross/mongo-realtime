/* eslint-disable no-underscore-dangle */
import BSON from 'bson';

import PermissionError from './errors';
import Perms from './perms';

const bson = new BSON();
const debug = require('debug')('mongo-realtime:connection');

// eslint-disable-next-line no-console
const { error } = console;

class Connection {
  constructor(perms, user, db, socket, rt) {
    this.user = user;
    this.rt = rt;
    this.db = db;
    this.socket = socket;
    this.perms = perms;
    this.watching = new Set();

    this.socket.send(bson.serialize({ op: 'userstatus', user: this.user.username }));

    socket.on('message', (data) => {
      this.message(bson.deserialize(data))
        .catch((err) => {
          error('Caught error in socket message handler');
          error('--');
          error(err);
          error('--');
        });
    });
    socket.on('close', () => this.unwatchAll());
  }

  unwatchAll() {
    this.watching.forEach((handle) => {
      this.rt.unwatch(handle);
      debug(`Unwatch ${handle}`);
    });
  }

  send(requestID, err, result) {
    let errorMessage = null;
    if (err) {
      errorMessage = err.toString();
    }
    this.socket.send(bson.serialize({ requestID, result, error: errorMessage }));
  }

  async insertOne(collection, doc, options) {
    const res = await this.db.collection(collection).insertOne(doc, options);
    const { n, ok } = res.result;
    return { n, ok };
  }

  findOne(collection, query, options) {
    return this.db.collection(collection).findOne(query, options);
  }

  find(collection, query, options) {
    return this.db.collection(collection).find(query, options).toArray();
  }

  async remove(collection, query, options) {
    const res = await this.db.collection(collection).remove(query, options);
    console.log(res);
    return {};
  }

  count(collection, query) {
    return this.db.collection(collection).find(query).count();
  }


  async updateOne(collection, query, update, options) {
    console.log('query, update, options', query, update, options);
    const res = await this.db.collection(collection).updateOne(query, update, options);
    const { result } = res;
    const { nModified, ok } = result;
    return { nModified, ok };
  }

  async updateMany(collection, query, update, options) {
    const res = await this.db.collection(collection).updateMany(query, update, options);
    const { result } = res;
    const { nModified, ok } = result;
    return { nModified, ok };
  }

  watchID(collection, query) {
    const handle = this.rt.watchID(collection, query, (op, doc) => {
      debug(`Update watcher ${handle} with op:${op} id:${doc._id}`);
      this.socket.send(bson.serialize({ handle, op, doc }));
    });
    this.watching.add(handle);
    return { handle };
  }

  watchQuery(collection, query, options) {
    // TODO: options
    const handle = this.rt.watchQuery(collection, query, options, (op, doc) => {
      debug(`Update watcher ${handle} with op:${op} id:${doc._id}`);
      this.socket.send(bson.serialize({ handle, op, doc }));
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

  generateRemoveQueryParams(collection, queryRule, query) {
    if (!queryRule.valid()) {
      throw new PermissionError(`User ${this.user.username} can not remove from collection ${collection}`);
    }

    if (typeof query !== 'object') {
      throw new PermissionError(`QueryEEE must be object (got ${typeof query})`);
    }

    const ruleResult = queryRule.result();
    if (!ruleResult) {
      throw new PermissionError(`User ${this.user.username} can not remove from collection ${collection}`);
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
    const {
      project, upsert, sort, limit, skip,
    } = (data.options || {});
    const options = {
      project, upsert, sort, limit, skip,
    };

    const rules = this.perms.rules(collection, this.user);

    let query;

    if (Perms.hasRemove(op)) {
      query = this.generateRemoveQueryParams(collection, rules.remove, data.query);
    } else if (Perms.hasQuery(op)) {
      query = this.generateQueryParams(collection, rules.query, data.query);
    }

    const update = Perms.hasUpdate(op)
      ? this.generateUpdateParams(collection, rules.update, data.update) : undefined;

    const doc = Perms.hasInsert(op, options.upsert)
      ? this.generateInsertParams(collection, rules.insert, data.doc, data.query) : undefined;

    return {
      query, update, doc, options,
    };
  }

  async performOperation(collection, op, query, doc, update, options) {
    let result;
    switch (op) {
      case 'insertOne':
        result = await this.insertOne(collection, doc, options);
        break;
      case 'updateOne':
        result = await this.updateOne(collection, query, update, options);
        break;
      case 'updateMany':
        result = await this.updateMany(collection, query, update, options);
        break;
      case 'findOne':
        result = await this.findOne(collection, query, options);
        break;
      case 'find':
        result = await this.find(collection, query, options);
        break;
      case 'remove':
        result = await this.remove(collection, query, options);
        break;
      case 'count':
        result = await this.count(collection, query, options);
        break;
      case 'watchID':
        result = await this.watchID(collection, query, options);
        break;
      case 'watchQuery':
        result = await this.watchQuery(collection, query, options);
        break;
      default:
        throw new PermissionError(`Unsupported operation ${op}`);
    }
    return result;
  }

  async message(data) {
    const { requestID, collection, op } = data;
    debug(`Recieved message: user:${this.user.username} wants to ${op} in ${collection}`);

    if (op === 'unwatch') {
      this.unwatch(data.handle);
      return;
    }

    let result;
    try {
      const {
        query, doc, update, options,
      } = this.generateParams(collection, op, data);
      result = await this.performOperation(collection, op, query, doc, update, options);
      debug(`Done: user:${this.user.username} ${op} - nModified:${result.nModified}`);
    } catch (err) {
      debug(err.message);
      if (err.isUserError) {
        this.socket.send(bson.serialize({ requestID, error: err.message }));
      } else {
        error(err);
        this.socket.send(bson.serialize({ requestID, error: 'ServerError' }));
      }
      return;
    }

    this.socket.send(bson.serialize({ requestID, result }));
  }
}

export default (...args) => new Connection(...args);
