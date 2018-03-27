import React from 'react';
import ReactDOM from 'react-dom';
import Login from './login';

let loginModal = null;

export function startLogin(auth) {
  if (loginModal === null) {
    document.body.innerHTML += '<div id="mongo-realtime-login"/>';
    loginModal = ReactDOM.render(React.createElement(Login, { auth }), document.getElementById('mongo-realtime-login'));
  }
  loginModal.handleOpen();
  return loginModal;
}

export function renderRegister(element) {
  ReactDOM.render(React.createElement(Login), element);
}
