
require('babel-register');

const main = require('./oplog');

main();

// const MongoOplog = require('mongodb');
// const oplog = MongoOplog('mongodb://127.0.0.1:27017/local')
//
// oplog.tail();
//
// // oplog.on('op', data => {
// //   console.log('op|',data);
// // });
//
// oplog.on('insert', doc => {
//   console.log('insert|', doc);
// });
//
// oplog.on('update', doc => {
//   console.log('update|',doc);
// });
//
// oplog.on('delete', doc => {
//   console.log('delete|',doc.o._id);
// });
//
// oplog.on('error', error => {
//   console.log('error|',error);
// });
//
// oplog.on('end', () => {
//   console.log('Stream ended');
// });
//
// oplog.stop(() => {
//   console.log('server stopped');
// });
