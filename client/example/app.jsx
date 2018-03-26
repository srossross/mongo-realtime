import React from 'react';
import List from './list';
import LoginModal from '../src/ui/login_or_register';

export default class App extends React.Component {
  state = { value: '-', user: null }
  componentWillMount() {
    this.ref = this.props.db.collection('cln1').ref('hello');

    this.props.db.auth().on('userstatus_changed', (user) => {
      console.log('userstatus_changed', user);
      this.setState({ user });
    });

    this.ref.on('changed', (doc) => {
      this.setState({ value: doc.value });
    });
    this.ref.subscribe();
    this.ref.get().then((doc) => {
      this.setState({ value: doc ? doc.value : 'undefined' });
    });
  }

  changeMe(e) {
    console.log(e.target.value);
    this.ref.set({ value: e.target.value });
  }


  logout() {
    this.props.db.auth().logout().then(() => {
      window.location.reload();
    });
  }

  handleLogin = () => {
    window.location.reload();
  }

  handleClose = () => {
    this.setState({ loginModalOpen: false });
  }

  render() {
    return (
      <div>
        Hello <input value={this.state.value} onChange={e => this.changeMe(e)} />
        { this.state.user ?
          <button onClick={() => this.logout()}>Logout {this.state.user.email}</button> :
          <button onClick={() => this.setState({ loginModalOpen: true })} >Login</button>
        }
        <LoginModal
          type="Login"
          open={this.state.loginModalOpen}
          auth={this.props.db.auth()}
          onLogin={this.handleLogin}
          onClose={this.handleClose}
        />
        <List db={this.props.db} user={this.state.user} />
      </div>
    );
  }
}
