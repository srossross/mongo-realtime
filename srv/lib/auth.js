import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import passport from './passport_utils';
import { addUser } from './db';

const app = express();
export default app;

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('dev'));
// app.use(require('cookie-parser')());
app.use(require('body-parser').json());


app.get(
  '/hello',
  (req, res) => {
    res.json({ ok: jwt.sign({ foo: 'bar' }, 'shhhhh') });
  },
);

app.post(
  '/login',
  passport.authenticate('local', { session: false }),
  (req, res) => res.json({ token: jwt.sign({ userid: req.user._id.toString() }, 'shhhhh') }),
);

const asm = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function bcryptHash(password, iter) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, iter, (err, passwordHash) => {
      if (err) return reject(err);
      return resolve(passwordHash);
    });
  });
}

app.post(
  '/register',
  asm(async (req, res) => {
    const { username, password } = req.body;
    const passwordHash = await bcryptHash(password, 10);
    const userid = await addUser({ username, passwordHash, registered: new Date() });
    return res.json({ token: jwt.sign({ userid }, 'shhhhh') });
  }),
);
