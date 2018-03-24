/* eslint-disable no-underscore-dangle,no-param-reassign */
const EventEmitter = require('events');
const debug = require('debug')('mongo-realtime:ref');


class RefBase extends EventEmitter {
  constructor(db, collection) {
    super();
    this.db = db;
    this.collection = collection;
  }

  subscribe() {
    const promise = this.db.executeCommand({
      collection: this.collection,
      op: 'watchQuery',
      query: this.query,
    });

    this.get().then(docs => this.handleInitial(docs));

    this.watching = promise.then(({ handle }) => {
      this.handle = handle;
      debug(`ref is subscribed ${handle}`);
      this.db.on(`handle/${handle}`, ({ op, doc }) => this.handleChange(op, doc));

      return { handle };
    });
  }

  unSubscribe() {
    return this.watching.then(({ handle }) => {
      this.db.executeCommand({
        collection: this.collection,
        op: 'unwatch',
        handle,
      }).then(() => debug(`ref is unsubscribed ${handle}`));
    });
  }
}

class Ref extends RefBase {
  constructor(db, collection, query) {
    super(db, collection);
    this.query = query;
  }

  get() {
    return this.db.collection(this.collection).find(this.query);
  }

  setAll(values) {
    return this.db.collection(this.collection).updateMany(this.query, { $set: values });
  }

  update(update) {
    return this.db.collection(this.collection).updateMany(this.query, update);
  }

  count() {
    return this.db.collection(this.collection).count(this.query);
  }

  handleInitial(docs) {
    this.docs = {};
    docs.forEach((doc) => {
      this.docs[doc._id] = doc;
    });
    this.emit('changed', docs);
  }

  handleChange(op, doc) {
    switch (op) {
      case 'u':
        this.emit('child_updated', doc);
        this.docs[doc._id] = doc;
        break;
      case 'i':
        this.emit('child_added', doc);
        this.docs[doc._id] = doc;
        break;
      case 'd':
        this.emit('child_removed', doc);
        delete this.docs[doc._id];
        break;
      default:
    }
    this.emit('changed', Object.values(this.docs));
  }
}

class RefOne extends RefBase {
  constructor(db, collection, id) {
    super(db, collection);
    this.id = id;
  }

  get query() {
    return { _id: this.id };
  }

  get(options) {
    return this.db.collection(this.collection).findOne(this.query, options);
  }

  set(values, options = {}) {
    if (options.upsert === undefined) {
      options.upsert = true;
    }
    return this.db.collection(this.collection).updateOne(this.query, { $set: values }, options);
  }

  create(values, options) {
    return this.db.collection(this.collection).insertOne(this.query, { $set: values }, options);
  }
  update(update, options) {
    return this.db.collection(this.collection).updateOne(this.query, update, options);
  }

  remove(options) {
    return this.db.collection(this.collection).remove(this.query, options);
  }

  count() {
    return this.db.collection(this.collection).count(this.query);
  }

  handleInitial(doc) {
    this.doc = doc;
    this.emit('changed', doc);
  }

  handleChange(op, doc) {
    switch (op) {
      case 'u':
        this.doc = doc;
        this.emit('changed', doc);
        break;
      case 'i':
        this.doc = doc;
        this.emit('changed', doc);
        break;
      case 'd':
        this.doc = null;
        this.emit('removed');
        break;
      default:
    }
  }
}

module.exports = { Ref, RefOne };
