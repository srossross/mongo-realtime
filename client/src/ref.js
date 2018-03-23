const EventEmitter = require('events');
const debug = require('debug')('mongo-realtime:ref');

// export const a = 1;

class Ref extends EventEmitter {
  constructor(db, collection, query) {
    super();
    this.db = db;
    this.collection = collection;
    this.query = query;
  }

  get() {
    return this.db.collection(this.collection).find(this.query);
  }

  set(values) {
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
    // this.db.collection(this.collection).update(this.query, { $set: values });
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

module.exports = { Ref };
