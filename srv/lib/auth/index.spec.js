import request from 'supertest';
import { expect } from 'chai';
// const express = require('express');
// const app = express();
import app from './index';

describe('auth', () => {
  describe('/register', () => {
    it('should validate', async () => {
      const res = await request(app).post('/register');
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });

    it('should register a user', async () => {
      const res = await request(app).post('/register')
        .send({ email: 'email@gmail.com', password: '123456' });
      expect(res.status).to.equal(200);

      expect(res.body).to.deep.equal({ registerOk: true });
    });

    it('should not register the same email twice', async () => {
      const res = await request(app).post('/register')
        .send({ email: 'email@gmail.com', password: '123456' });
      expect(res.status).to.equal(200);
      const res2 = await request(app).post('/register')
        .send({ email: 'email@gmail.com', password: '123456' });
      expect(res2.status).to.equal(400);
    });
  });
});
