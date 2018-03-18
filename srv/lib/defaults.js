
export const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/';
export const PORT = process.env.PORT || 3333;
export const MONGO_OPTIONS = {
  replicaSet: process.env.MONGO_REPLICA_SET || 'rs0',
};
