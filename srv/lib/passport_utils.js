import bcrypt from 'bcrypt';

const passport = require('passport');
const { Strategy } = require('passport-local');


function bcryptCompare(password, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    });
  });
}

const { getUser } = require('./db');

const debug = require('debug')('mongo-realtime:passport');

export default passport;

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(async (username, password, done) => {
  try {
    const user = await getUser({ username });
    if (!user) {
      debug(`User ${username} does not exist`);
      return done(null, false);
    }
    console.log('password, user.passwordHash', password, user.passwordHash);
    if (await bcryptCompare(password, user.passwordHash)) {
      debug(`${username} OK`);
      return done(null, user);
    }
    debug(`User ${username} bad password`);
    return done(null, false);
  } catch (err) {
    debug(`DB error ${username}`);
    return done(err);
  }
}));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
// passport.serializeUser((user, cb) => {
//   cb(null, user._id.toString());
// });
//
// passport.deserializeUser((id, cb) => {
//   db.users.findById(id, (err, user) => {
//     if (err) { return cb(err); }
//     cb(null, user);
//   });
// });
