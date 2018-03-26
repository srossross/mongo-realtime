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
      createUserWithEmailAndPassword: PropTypes.func.isRequired,
    }).isRequired,
    onLogin: PropTypes.func.isRequired,
    onChangeType: PropTypes.func.isRequired,
  }

  state = {
    password: '',
    confirmPassword: '',
    email: '',
    submitted: false,
  };

  get anyInvalid() {
    return Boolean(this.state.emailError ||
      this.state.passwordError ||
      this.state.confirmPasswordError);
  }

  get body() {
    return JSON.stringify({
      email: this.state.email,
      password: this.state.password,
    });
  }

  handleLogin() {
    if (this.props.onLogin) {
      this.setState({ submitted: false });
      this.props.onLogin();
    }
  }

  handleSubmit = () => {
    if (this.state.submitted || this.anyInvalid) {
      return;
    }
    this.setState({ submitted: true }, () => {
      this.props.auth.createUserWithEmailAndPassword(this.state.email, this.state.password)
        .then(() => this.handleLogin())
        .catch(err => this.setState({
          emailError: err.email,
          passwordError: err.password,
          submitted: false,
        }));
    });
  };

  handleChangeType = (e) => {
    e.preventDefault();
    this.props.onChangeType('Login');
  };

  handleUpdateConfirmPassword = (e) => {
    this.setState({
      confirmPassword: e.target.value,
      confirmPasswordError: e.target.value === this.state.password ? null : 'must match password',
    });
  }

  handleUpdatePassword = (e) => {
    this.setState({
      password: e.target.value,
      confirmPasswordError: e.target.value === this.state.confirmPassword ? null : 'must match password',
      passwordError: e.target.value.length < 6 ? 'does not meet minimum length of 6' : null,
    });
  }

  handleUpdateEmail = (e) => {
    this.setState({
      email: e.target.value,
    });
  }

  validateEmail = () => {
    if (this.state.email.length === 0) {
      this.setState({ emailError: 'email field is required' });
    } else if (!this.state.email.includes('@')) {
      this.setState({ emailError: 'valid email field is required' });
    } else {
      this.setState({ emailError: null });
    }
  }

  render() {
    return (
      <div>
        <TextField
          hintText="Email"
          type="email"
          style={{ width: '100%', marginBottom: '12px' }}
          value={this.state.email}
          errorText={this.state.emailError}
          onChange={this.handleUpdateEmail}
          onBlur={this.validateEmail}
        />
        <TextField
          hintText="Password"
          type="password"
          style={{ width: '100%', marginBottom: '12px' }}
          value={this.state.password}
          errorText={this.state.passwordError}

          onChange={e => this.setState({ password: e.target.value })}
        />
        <TextField
          hintText="Confirm Password"
          type="password"
          style={{ width: '100%', marginBottom: '12px' }}
          value={this.state.confirmPassword}
          errorText={this.state.confirmPasswordError}
          onChange={this.handleUpdateConfirmPassword}
        />
        <RaisedButton
          label={this.state.submitted ? 'Working ...' : 'Register'}
          primary
          keyboardFocused
          fullWidth
          disabled={this.anyInvalid || this.state.submitted}
          onClick={this.handleSubmit}
        />
        <div style={{ textAlign: 'center', padding: '12px' }}>
            Aldready a member ? <a href="register" onClick={this.handleChangeType}>Login.</a>
        </div>
      </div>
    );
  }
}
