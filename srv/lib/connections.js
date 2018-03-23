import connection from './connection';

const debug = require('debug')('mongo-realtime:server');

export default function connections(client, perms, db, rt) {
  return async (socket) => {
    debug('Client Connected', socket.id);
    debug('Client Connected', socket.request.headers);
    connection(perms, {}, db, socket, rt);
  };
}
