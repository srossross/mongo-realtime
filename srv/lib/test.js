/* eslint-disable global-require */
require('babel-register');

const defaults = require('./defaults');

before(async () => {
  defaults.MONGO_USER_DB = 'test_users';
});

afterEach(async () => {
  const client = await require('./db').getClient();
  await client.db('test_users').collection('users').remove({});
});

after(async () => {
  const client = await require('./db').getClient();
  await client.db('test_users').dropDatabase();
  require('./db').close();
});
