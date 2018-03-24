
export default class QuerySubscription {
  constructor(qid, query, options, callback) {
    if (typeof callback !== 'function') {
      throw new Error(`callback must be a function (got ${typeof callback})`);
    }
    this.qid = qid;
    this.query = query;
    this.options = options;

    this.callback = callback;
    this.querySet = {};
    this.pending = Promise.resolve();
  }
  add(id) {
    this.querySet[id] = true;
  }

  remove(id) {
    delete this.querySet[id];
  }

  queueNext(next) {
    const safeNext = async () => {
      try {
        await next();
      } catch (err) {
        this.callback('error', err);
      }
    };

    this.pending.then(safeNext);
  }
}
