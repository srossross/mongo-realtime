
const debug = require('debug')('mongo-realtime:connection');

class Connection {
  constructor(perms, user, db, socket) {
    this.user = user;
    this.db = db;
    this.socket = socket;
    this.perms = perms;

    socket.on('message', data => this.message(JSON.parse(data)));
  }

  send(requestID, err, result) {
    let error = null;
    if (err) {
      error = err.toString();
    }
    this.socket.send(JSON.stringify({ requestID, result, error }));
  }

  insertOne(data, ruleResult) {
    if (!ruleResult) {
      throw new Error('can not insert data');
    }
    return this.db.collection(data.collection).insertOne(data.doc);
  }

  findOne(data, ruleResult) {
    return this.db.collection(data.collection).findOne(Object.assign(data.query, ruleResult));
  }

  find(data, ruleResult) {
    return this.db.collection(data.collection)
      .find(Object.assign(data.query, ruleResult)).toArray();
  }

  async message(data) {
    const { requestID, collection, op } = data;
    debug(`Recieved message: user:${this.user.username} wants to ${op} in ${collection}`);
    const rule = this.perms.rule(collection, this.user, op);

    if (!rule.valid()) {
      debug('rule is not valid');
      this.send(requestID, `User ${this.user.username} can not ${op} collection ${collection}`);
    }

    const ruleResult = rule.result(data);

    let result;
    try {
      switch (op) {
        case 'insertOne':
          result = await this.insertOne(data, ruleResult);
          break;
        case 'findOne':
          result = await this.findOne(data, ruleResult);
          break;
        case 'find':
          result = await this.find(data, ruleResult);
          break;
        default:
          throw new Error();
      }
    } catch (err) {
      this.socket.send(JSON.stringify({ requestID, error: err.toString() }));
      return;
    }
    this.socket.send(JSON.stringify({ requestID, result }));
  }
}

export default (perms, user, db, socket) => new Connection(perms, user, db, socket);
