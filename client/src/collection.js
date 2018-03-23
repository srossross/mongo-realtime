const { Ref } = require('./ref');

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
  insertOne(doc) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'insertOne',
      doc,
    });
  }

  updateOne(query, update) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'updateOne',
      query,
      update,
    });
  }
  updateMany(query, update) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'updateMany',
      query,
      update,
    });
  }

  findOne(query, callback) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'findOne',
      query,
    }, callback);
  }

  find(query, callback) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'find',
      query,
    }, callback);
  }

  count(query, callback) {
    return this.db.executeCommand({
      collection: this.collection,
      op: 'count',
      query,
    }, callback);
  }

  ref(IdOrQuery) {
    return new Ref(this.db, this.collection, IdOrQuery);
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
