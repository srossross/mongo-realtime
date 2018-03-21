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
    return this.db.collection(this.collection).update(this.query, { $set: values });
  }

  subscribe() {
    const promise = this.db.executeCommand({
      collection: this.collection,
      op: 'watchQuery',
      query: this.query,
    });

    console.log('promise.requestID', promise.requestID);
    this.watching = promise.then(({ handle }) => {
      this.handle = handle;
      return { handle };
    });

    this.db.on(`message/${promise.requestID}`, ({ op, doc }) => {
      console.log('got message', op, doc);
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
    return this.watching.then(({ handle }) => this.db.executeCommand({
      collection: this.collection,
      op: 'unwatch',
      handle,
    }));
  }
}

module.exports = { Ref };
//
// class Ref extends EventEmitter {
//   constructor(collection, query) {
//     super();
//     this.subscriptions = {};
//     this.collection = collection;
//     this.query = query;
//     this.STATE = 'FETCHING';
//
//     this.once('ready', (doc) => {
//       this.STATE = 'READY';
//       this.doc = doc;
//     });
//   }
//
//   setRequestID(requestID) {
//     this.requestID = requestID;
//   }
//
//   ready(cb) {
//     if (this.STATE === 'READY') {
//       cb(this.doc);
//     }
//     this.once('ready', cb);
//   }
//
//   val() {
//     return this.doc;
//   }
// }
//
// class DocumentListRef extends Ref {
// }
//
// class DocumentRef extends Ref {
//
// }
//
// module.exports = {
//   DocumentRef, DocumentListRef,
// };
