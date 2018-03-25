import { parse } from 'cookie';
import connection from './connection';
import { verify } from './webtoken';
import { getUserFromID } from './db';

const debug = require('debug')('mongo-realtime:connections');

export default function connections(client, perms, db, rt) {
  return async (socket) => {
    debug('Client Connected', socket.id);
    const authToken = parse(socket.request.headers.cookie)['auth-token'];
    let payload;
    let user = {};
    if (authToken) {
      try {
        payload = await verify(authToken);
        debug('authToken payload', payload);
        user = await getUserFromID(payload.userid);
        debug(`Logged in as user ${user.username}`);
      } catch (err) {
        const [opts] = authToken.split('.');
        const header = Buffer.from(opts, 'base64').toString();
        debug(`JWT ${err.message} header:${header} continuing as anonymous user`);
      }
    } else {
      debug('No authToken', payload);
    }

    connection(perms, user, db, socket, rt);
  };
}
