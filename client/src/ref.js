const EventEmitter = require('events');
const debug = require('debug')('mongo-realtime:ref');

// export const a = 1;

class RefBase extends EventEmitter {
  constructor(db, collection) {
    super();
    this.db = db;
    this.collection = collection;
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

  subscribe() {
    const promise = this.db.executeCommand({
      collection: this.collection,
      op: 'watchQuery',
      query: this.query,
    });

    this.watching = promise.then(({ handle }) => {
      this.handle = handle;
      debug(`ref is subscribed ${handle}`);
      return { handle };
    });

    this.db.on(`message/${promise.requestID}`, ({ op, doc }) => {
      switch (op) {
        case 'u':
          this.emit('child_updated', doc);
          break;
        case 'i':
          this.emit('child_added', doc);
          break;
        case 'd':
          this.emit('child_removed', doc);
          break;
        default:
      }
    });
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

  set(values, options) {
    return this.db.collection(this.collection).updateOne(this.query, { $set: values }, options);
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

  subscribe() {
    const promise = this.db.executeCommand({
      collection: this.collection,
      op: 'watchQuery',
      query: { _id: this.id },
    });

    this.watching = promise.then(({ handle }) => {
      this.handle = handle;
      debug(`ref is subscribed ${handle}`);
      return { handle };
    });

    this.db.on(`message/${promise.requestID}`, ({ op, doc }) => {
      switch (op) {
        case 'u':
          this.emit('changed', doc);
          break;
        case 'i':
          this.emit('changed', doc);
          break;
        case 'd':
          this.emit('removed', doc);
          break;
        default:
      }
    });
  }
}

module.exports = { Ref, RefOne };
