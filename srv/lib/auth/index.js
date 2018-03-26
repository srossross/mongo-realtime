/* eslint-disable no-underscore-dangle */
import express from 'express';
import { validate } from 'express-jsonschema';
import { badRequest, forbidden, isBoom } from 'boom';
import bcrypt from 'bcrypt';

import { sign } from '../webtoken';
import passport from './passport_utils';
import { addUser } from '../db';

const app = express();

export default app;

const asm = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
// app.use(require('morgan')(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

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

const loginSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      minLength: 1,
      required: true,
    },
    password: {
      type: 'string',
      minLength: 1,
      required: true,
    },
  },
};

app.post(
  '/login',
  validate({ body: loginSchema }),
  asm(async (req, res, next) => {
    passport.authenticate('local', async (err, user, info) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        next(forbidden('Bad Login', info));
      } else {
        const token = await sign({ userid: user._id.toString() });
        res.cookie('auth-token', token, { httpOnly: true });
        res.json({ loginOk: true });
      }
    })(req, res, next);
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

const registerSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'email',
      required: true,
    },
    password: {
      type: 'string',
      minLength: 6,
      required: true,
    },
  },
};

app.post(
  '/register',
  validate({ body: registerSchema }),
  asm(async (req, res) => {
    const { email, password } = req.body;
    const passwordHash = await bcryptHash(password, 10);
    const userid = await addUser({ email, passwordHash, registered: new Date() });

    const token = await sign({ userid: userid.toString() });
    res.cookie('auth-token', token, { httpOnly: true });
    res.json({ registerOk: true });
  }),
);

app.use((err, req, res, next) => {
  if (err.name === 'JsonSchemaValidation') {
    const errors = {};
    err.validations.body.forEach(({ property, messages }) => {
      errors[property.slice('request.body.'.length)] = messages;
    });
    next(badRequest('Validation failed', errors));
    return;
  }
  next(err);
});

app.use((err, req, res, next) => {
  if (isBoom(err)) {
    res.status(err.output.statusCode);
    res.json({
      message: err.output.payload.message,
      errorType: err.output.payload.error,
      errors: err.data,
    });
    return;
  }
  next(err);
});
