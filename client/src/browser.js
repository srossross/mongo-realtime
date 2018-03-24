
const MongoWebDB = require('./index');

window.mongoRealtime = {
  MongoWebDB,
  initializeApp: (opts) => {
    window.mongoRealtime.db = new MongoWebDB(opts);
  },
};
