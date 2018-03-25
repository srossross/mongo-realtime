const EventEmitter = require('events');

class Auth extends EventEmitter {
  constructor(db) {
    super();
    this.db = db;
    db.on('op/userstatus', ({ user }) => {
      console.log('op/userstatus data data data data', user);
      this.emit('userstatus_changed', user);
    });
  }

  get url() {
    return this.db.url;
  }

  loginWithEmailAndPassword(email, password) {
    const opts = {
      body: JSON.stringify({ username: email, password }),
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
      mode: 'cors',
      redirect: 'error',
      // referrer: 'no-referrer', // *client, no-referrer
    };
    return fetch(`http://${this.url}/login`, opts)
      .then((res) => {
        if (res.status !== 200) {
          throw new Error({ message: 'invalid login', res });
        }
        res.json();
      });
  }

  logout() {
    return fetch(`http://${this.url}/logout`, {
      method: 'POST',
      mode: 'cors',
      redirect: 'error',
      cache: 'no-cache',
      credentials: 'include',
    })
      .then((res) => {
        if (res.status !== 200) {
          throw new Error({ message: 'invalid logout', res });
        }
        return res.json();
      });
  }
}

module.exports = Auth;
