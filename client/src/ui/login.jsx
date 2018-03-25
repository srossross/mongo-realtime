import React from 'react';
import PropTypes from 'prop-types';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
// import RaisedButton from 'material-ui/RaisedButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import TextField from 'material-ui/TextField';
/**
 * Dialog with action buttons. The actions are passed in as an array of React objects,
 * in this example [FlatButtons](/#/components/flat-button).
 *
 * You can also close this dialog by clicking outside the dialog, or with the 'Esc' key.
 */
export default class DialogExampleSimple extends React.Component {
  static defaultProps = {
    open: false,
  }

  static propTypes = {
    auth: PropTypes.shape({
      loginWithEmailAndPassword: PropTypes.func.isRequired,
    }).isRequired,
    onLogin: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool,
  }

  state = {
    password: '',
    email: '',
  };

  get body() {
    return JSON.stringify({
      username: this.state.email,
      password: this.state.password,
    });
  }

  handleClose = () => {
    this.props.onClose();
  };

  handleLogin() {
    if (this.props.onLogin) {
      this.props.onLogin();
    }
  }
  handleSubmit = () => {
    this.props.auth.loginWithEmailAndPassword(this.state.email, this.state.password)
      .then(() => this.handleLogin());
  };

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        primary
        onClick={this.handleClose}
      />,
      <FlatButton
        label="Login"
        primary
        keyboardFocused
        onClick={this.handleSubmit}
      />,
    ];

    return (
      <MuiThemeProvider>
        <div>
          <Dialog
            title="Login"
            actions={actions}
            modal={false}
            open={this.props.open}
            onRequestClose={this.handleClose}

          >
            <TextField
              hintText="Email"
              floatingLabelText="Email"
              type="email"
              value={this.state.email}
              onChange={e => this.setState({ email: e.target.value })}
            />
            <TextField
              hintText="Password"
              floatingLabelText="Password"
              type="password"
              value={this.state.password}
              onChange={e => this.setState({ password: e.target.value })}
            />
          </Dialog>
        </div>
      </MuiThemeProvider>
    );
  }
}
