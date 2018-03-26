import React from 'react';
import PropTypes from 'prop-types';
import Dialog from 'material-ui/Dialog';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Login from './login';
import Register from './register';
/**
 * Dialog with action buttons. The actions are passed in as an array of React objects,
 * in this example [FlatButtons](/#/components/flat-button).
 *
 * You can also close this dialog by clicking outside the dialog, or with the 'Esc' key.
 */
export default class LoginOrRegister extends React.Component {
  static defaultProps = {
    open: false,
  }

  static propTypes = {
    auth: PropTypes.shape({
      loginWithEmailAndPassword: PropTypes.func.isRequired,
    }).isRequired,
    type: PropTypes.string.isRequired,
    open: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onLogin: PropTypes.func.isRequired,
    // onRegister: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = { type: props.type };
  }

  handleClose = () => {
    this.props.onClose();
  };

  handleChangeType = (type) => {
    this.setState({ type });
  };

  render() {
    const content = this.state.type === 'Login' ?
      (<Login
        auth={this.props.auth}
        onLogin={this.props.onLogin}
        onChangeType={this.handleChangeType}
      />) :
      (<Register
        auth={this.props.auth}
        onLogin={this.props.onLogin}
        onChangeType={this.handleChangeType}
      />);

    return (
      <MuiThemeProvider>
        <div>
          <Dialog
            title={this.state.type}
            titleStyle={{
              textAlign: 'center',
              backgroundColor: '#7fc857',
              color: 'white',
            }}
            bodyStyle={{ padding: '27px' }}
            modal={false}
            open={this.props.open}
            onRequestClose={this.handleClose}

          >
            {content}
          </Dialog >
        </div>
      </MuiThemeProvider>
    );
  }
}
