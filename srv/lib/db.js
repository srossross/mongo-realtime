import { MongoClient } from 'mongodb';
import { ObjectId } from 'bson';
import { badRequest } from 'boom';
import MongoRealTimeClient from './real-time-client';
import { MONGO_URL, MONGO_OPTIONS, MONGO_USER_DB } from './defaults';

const debug = require('debug')('mongo-realtime:db');

const { error } = console;

export async function getClient() {
  if (!getClient.client) {
    getClient.client = await MongoClient.connect(MONGO_URL, MONGO_OPTIONS);
    debug(`Connected to mongo @ ${MONGO_URL}`);


    debug(`Using user database ${MONGO_USER_DB}`);
    const users = getClient.client.db(MONGO_USER_DB).collection('users');
    try {
      await users.createIndex('email', { dropDups: true, unique: true });
    } catch (err) {
      error(`ERROR db:${MONGO_USER_DB} collection:users`, err.message);
    }
  }

  return getClient.client;
}

export async function getRTClient() {
  if (!getRTClient.rtclient) {
    getRTClient.rtclient = await MongoRealTimeClient.connect(await getClient());
  }
  return getRTClient.rtclient;
}

export function close() {
  if (getClient.client) {
    debug('Closing mongo connection');
    getClient.client.close();
  }
  getClient.client = null;
  getRTClient.rtclient = null;
}
export async function addUser(data) {
  const client = await getClient();
  const collection = client.db(MONGO_USER_DB).collection('users');
  try {
    // const result =
    await collection.insertOne(data);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      const message = `User with email ${data.email} already exists`;
      throw badRequest(message, { email: [message] });
    }
    throw err;
  }
  return data._id;
}

export async function getUser(data) {
  const client = await getClient();
  const collection = client.db(MONGO_USER_DB).collection('users');
  return collection.findOne(data);
}
export async function getUserFromID(userid) {
  return getUser({ _id: ObjectId(userid) });
}
