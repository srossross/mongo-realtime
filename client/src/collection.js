const { Ref, RefOne } = require('./ref');

/**
 * Mongo web collection
 */
class MongoWebCollection {
  constructor(db, collection) {
    this.db = db;
    this.collection = collection;
  }

  /**
   * insert one document.
   *
   * @param {object} doc - document to insert
   * @example
   * db.collection('eggs').insertOne({ shell: true })
   * console.log(result);
   */
  insertOne(doc, options) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'insertOne',
      doc,
      options,
    });
  }

  updateOne(query, update, options) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'updateOne',
      query,
      update,
      options,
    });
  }
  updateMany(query, update, options) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'updateMany',
      query,
      update,
      options,
    });
  }

  findOne(query, options) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'findOne',
      query,
      options,
    });
  }

  find(query, options) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'find',
      query,
      options,
    });
  }

  remove(query, options) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'remove',
      query,
      options,
    });
  }

  count(query, callback) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'count',
      query,
    }, callback);
  }

  ref(IdOrQuery) {
    if (typeof IdOrQuery === 'object') {
      return new Ref(this.db, this.collection, IdOrQuery);
    }
    return new RefOne(this.db, this.collection, IdOrQuery);
  }

  unwatch(requestID) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'unwatch',
      requestID,
    });
  }
}

module.exports = MongoWebCollection;
