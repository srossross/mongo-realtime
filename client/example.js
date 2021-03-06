/* eslint-disable no-console */


const MongoWebClient = require('./src/index');

const client = new MongoWebClient('localhost:3333');

async function mainRefMany() {
  const docs = await client.collection('cln1').find({ b: 1 });

  console.log('!!ready', docs.length);

  const ref = client.collection('cln1').ref({ b: 1 });

  ref.on('child_added', (doc) => {
    console.log('!!child_added', doc);
  });
  ref.on('child_updated', (doc) => {
    console.log('!!child_updated', doc);
  });
  ref.on('child_removed', (doc) => {
    console.log('!!child_removed', doc);
  });

  await ref.subscribe();

  // console.log('await', await client.collection('cln1').find(undefined));
  // ref.set({ hello: 'world' });
}

async function main() {
  const ref = client.collection('cln1').ref('hello');

  ref.on('changed', (doc) => {
    console.log('!!child_added', doc);
  });
  ref.on('removed', (doc) => {
    console.log('!!child_removed', doc);
  });

  await ref.subscribe();

  console.log('await ref.get()', await ref.get());
  console.log('await ref.get()', await ref.set({ a: 1 }));
  console.log('await ref.get()', await ref.get());
}

// client.login({ username: 'x1' }, () => {
main().then('done main').catch(err => console.error(err));

// client.login({ username: 'xyz', password: 'xyz' });
// });
