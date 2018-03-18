const engine = require('engine.io-client');

class MongoWebClient {
  constructor(url) {
    this.socket = engine(url);
    const { socket } = this;

    this.requestID = 0;
    socket.on('error', (err) => {
      throw err;
    });
    this.promises = {};
    socket.on('message', data => this.handleMessage(data));
  }

  close(){
    this.socket.close()
  }

  handleMessage(buf) {
    const data = JSON.parse(buf);

    const waitingResponse = this.promises[data.requestID]
    if (!waitingResponse){
      console.log('unknown response', data);
      return;
    }
    const { resolve, reject } = this.promises[data.requestID];
    delete this.promises[data.requestID];

    if (data.error) {
      reject(data.error);
      return;
    }

    resolve(data.result);
  }

  login(data){
    return this.executeCommand({
      op: 'login',
      data,
    });
  }
  executeCommand(cmd) {
    const req = Object.assign({
      requestID: this.requestID += 1,
    }, cmd);

    this.socket.send(JSON.stringify(req));

    return new Promise((resolve, reject) => {
      this.promises[req.requestID] = { resolve, reject };
    });
  }

  insertOne(doc) {
    return this.executeCommand({
      collection: 'cln1',
      op: 'insertOne',
      doc,
    });
  }

  findOne(query) {
    return this.executeCommand({
      collection: 'cln1',
      op: 'findOne',
      query,
    });
  }

  find(query) {
    return this.executeCommand({
      collection: 'cln1',
      op: 'find',
      query,
    });
  }
}


const client = new MongoWebClient('ws://localhost:3333');
client.socket.on('open', () => {
  client.login({username:'x1'});
  client.findOne({})
  .then((res) => {
    console.log('found', res);
  })
  .then(()=>{
    client.close();
  });

  // client.insertOne({ a: 1 }).then((res) => {
  //   console.log('found', res);
  // });
});
