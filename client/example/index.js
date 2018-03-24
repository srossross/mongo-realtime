import React from 'react';
import ReactDOM from 'react-dom';
import MongoWebDB from '../src';
import App from './app';

const db = new MongoWebDB('localhost:3333');
// window.mongoRealtime.initializeApp('localhost:3333');

ReactDOM.render(React.createElement(App, { db }), document.getElementById('root'));
