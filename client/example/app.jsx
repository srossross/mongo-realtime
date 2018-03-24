import React from 'react';
import List from './list';

export default class App extends React.Component {
  state = { value: '-' }
  componentWillMount() {
    this.ref = this.props.db.collection('cln1').ref('hello');

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

  render() {
    return (
      <div>
        Hello <input value={this.state.value} onChange={e => this.changeMe(e)} />
        <List db={this.props.db} />
      </div>
    );
  }
}
