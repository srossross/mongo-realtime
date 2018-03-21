import { Timestamp } from 'mongodb';

export default async function oplogStream(client) {
  const collection = client.db('local').collection('oplog.rs');
  const doc = await collection.findOne({}, { sort: { $natural: -1 } });
  const ts = doc ? doc.ts : Timestamp(0, Date.now() / 1000);

  const cursor = collection.find({ op: { $in: ['d', 'i', 'u'] }, ts: { $gt: ts } }, {
    tailable: true,
    awaitData: true,
    await_data: true,
    oplogReplay: true,
    noCursorTimeout: true,
    numberOfRetries: -1,
  });
  return cursor.stream();
}
