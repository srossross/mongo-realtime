import React from 'react';
import PropTypes from 'prop-types';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
/**
 * Dialog with action buttons. The actions are passed in as an array of React objects,
 * in this example [FlatButtons](/#/components/flat-button).
 *
 * You can also close this dialog by clicking outside the dialog, or with the 'Esc' key.
 */
export default class Login extends React.Component {
  static propTypes = {
    auth: PropTypes.shape({
      loginWithEmailAndPassword: PropTypes.func.isRequired,
    }).isRequired,
    onLogin: PropTypes.func.isRequired,
    onChangeType: PropTypes.func.isRequired,
  }

  state = {
    password: '',
    email: '',
  };

  get body() {
    return JSON.stringify({
      email: this.state.email,
      password: this.state.password,
    });
  }

  handleLogin() {
    if (this.props.onLogin) {
      this.props.onLogin();
    }
  }

  handleSubmit = () => {
    this.props.auth.loginWithEmailAndPassword(this.state.email, this.state.password)
      .then(() => this.handleLogin())
      .catch((err) => {
        this.setState({
          emailError: err.email,
          passwordError: err.password,
        });
      });
  };

  handleChangeType = (e) => {
    e.preventDefault();
    this.props.onChangeType('Register');
  };

  render() {
    return (
      <div>
        <TextField
          hintText="Email"
          type="email"
          style={{ width: '100%', marginBottom: '12px' }}
          value={this.state.email}
          errorText={this.state.emailError}
          onChange={e => this.setState({ email: e.target.value, emailError: null })}
        />
        <TextField
          hintText="Password"
          type="password"
          style={{ width: '100%', marginBottom: '12px' }}
          value={this.state.password}
          errorText={this.state.passwordError}
          onChange={e => this.setState({ password: e.target.value, passwordError: null })}
        />
        <RaisedButton
          label="Login"
          primary
          keyboardFocused
          fullWidth
          onClick={this.handleSubmit}
        />
        <div style={{ textAlign: 'center', padding: '12px' }}>
            Not registered? <a href="register" onClick={this.handleChangeType}>Create an account.</a>
        </div>
      </div>
    );
  }
}
