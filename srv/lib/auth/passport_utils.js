import bcrypt from 'bcrypt';

import passport from 'passport';
import { Strategy } from 'passport-local';
import { getUser } from '../db';

const debug = require('debug')('mongo-realtime:passport');

export default passport;

function bcryptCompare(password, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    });
  });
}


// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use('local', new Strategy(
  {
    usernameField: 'email',
  },
  async (email, password, done) => {
    try {
      const user = await getUser({ email });
      if (!user) {
        debug(`User ${email} does not exist`);
        return done(null, false, { email: `User ${email} does not exist` });
      }
      if (await bcryptCompare(password, user.passwordHash)) {
        debug(`User ${email} OK`);
        return done(null, user);
      }
      debug(`User ${email} bad password`);
      return done(null, false, { password: 'Invalid password' });
    } catch (err) {
      debug(`DB error ${email}`);
      return done(err);
    }
  },
));
