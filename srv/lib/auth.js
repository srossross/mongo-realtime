/* eslint-disable no-underscore-dangle */
import express from 'express';
import bcrypt from 'bcrypt';

import { sign } from './webtoken';
import passport from './passport_utils';
import { addUser } from './db';

const app = express();
export default app;

const asm = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('dev'));
// app.use(require('cookie-parser')());
app.use(require('body-parser').json());

app.use((req, res, next) => {
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  next();
});

app.use(
  '/hello',
  asm(async (req, res) => {
    if (req.query.cookie) {
      res.cookie(req.query.cookie, req.query.cookie);
    }
    res.json({ ok: await sign({ foo: 'bar' }) });
  }),
);

app.post(
  '/login',
  passport.authenticate('local', { session: false }),
  asm(async (req, res) => {
    const token = await sign({ userid: req.user._id.toString() });
    res.cookie('auth-token', token, { httpOnly: true });
    res.json({ loginOk: true });
  }),
);
app.post(
  '/logout',
  asm(async (req, res) => {
    res.cookie('auth-token', '', { httpOnly: true });
    res.json({ logoutOk: true });
  }),
);


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
    return res.json({ token: await sign({ userid }) });
  }),
);
