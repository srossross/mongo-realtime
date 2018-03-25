import { MongoClient } from 'mongodb';
import { ObjectId } from 'bson';
import MongoRealTimeClient from './real-time-client';
import { MONGO_URL, MONGO_OPTIONS } from './defaults';

const debug = require('debug')('mongo-realtime:db');

export async function getClient() {
  if (!getClient.client) {
    getClient.client = await MongoClient.connect(MONGO_URL, MONGO_OPTIONS);
    debug(`Connected to mongo @ ${MONGO_URL}`);
  }
  return getClient.client;
}

export async function getRTClient() {
  if (!getRTClient.rtclient) {
    getRTClient.rtclient = await MongoRealTimeClient.connect(await getClient());
  }
  return getRTClient.rtclient;
}

export async function addUser(data) {
  const client = await getClient();
  const collection = client.db('users').collection('users');
  const result = await collection.insertOne(data);
  console.log(result, data);
  return data._id;
}

export async function getUser(data) {
  const client = await getClient();
  const collection = client.db('users').collection('users');
  return collection.findOne(data);
}
export async function getUserFromID(userid) {
  return getUser({ _id: ObjectId(userid) });
}
