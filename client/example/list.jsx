import React from 'react';

export default class List extends React.Component {
  state = { value: 'New Item', docs: [] }
  componentWillMount() {
    this.ref = this.props.db.collection('items').ref({ helloItem: true });

    this.ref.on('changed', docs =>
      this.setState({ docs }));

    this.ref.subscribe();
  }

  addOne() {
    this.props.db.collection('items').insertOne({
      helloItem: true,
      pushed: true,
      value: this.state.value,
      userId: this.props.user._id,
    });
  }
  removeOne(e, _id) {
    e.preventDefault();
    this.props.db.collection('items').remove({ _id });
  }

  render() {
    return (
      <div>
        <ul>
          {this.state.docs.map(doc => (
            <li key={doc._id}>
            Doc {doc._id.toString()} <a href="#" onClick={e => this.removeOne(e, doc._id)}>rm</a>
            </li>))}
          <li>hi</li>
        </ul>
        <input value={this.state.value} onChange={e => this.setState({ value: e.target.value })} />
        <button
          onClick={() => this.addOne()}
        >
          Add
        </button>
      </div>
    );
  }
}
