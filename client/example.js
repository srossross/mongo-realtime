const MongoWebClient = require('./src/index');

const client = new MongoWebClient('ws://localhost:3333');

client.login({ username: 'x1' }, async () => {
  // const ref = client.collection('cln1').findOne({ b: 1 });
  //
  // console.log('ref');
  //
  // ref.ready((doc) => {
  //   console.log('ready', doc);
  // });
  //
  // ref.subscribe('change', () => {
  //   console.log('  change | ', ref.val());
  // });
  //
  // setTimeout(() => client.collection('cln1').updateOne({ b: 1 }, { $inc: { a: 1 } }), 1000);
  // const docs = await client.collection('cln1').find({ b: 1 });
  // console.log('!!ready', docs);

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

  console.log('!!ready', await ref.get());
  await ref.subscribe();

  await ref.unSubscribe();


  // ref.ready((doc) => {
  //   console.log('ready', doc);
  // });
  // const ref = client.collection('cln1').ref('').find({ b: 1 });
});
