
export default class MongoRealTimeDb {
  constructor(client, dbName) {
    this.client = client;
    this.dbName = dbName;
  }

  watchID(clnName, id, callback) {
    return this.client.watchID(this.dbName, clnName, id, callback);
  }

  watchQuery(clnName, query, options, callback) {
    return this.client.watchQuery(this.dbName, clnName, query, options, callback);
  }

  unwatch(handle) {
    return this.client.unwatch(handle);
  }
}
