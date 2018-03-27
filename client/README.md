
# Get Started

## Web
```
<script src="https://storage.googleapis.com/mongo-realtime/cdn/1.0.0/mongo-realtime.js"></script>
<script>
  // Initialize
  // TODO: Replace with your project's customized code snippet
  var config = {
    domain: "localhost:3333",
  };
  mongoRT.initializeApp(config);
</script>
```

## Node JS

### Installation

```sh
npm install mongo-realtime-client
```

### Usage
```
var mongoRT = require("mongo-realtime-client");
var config = {
  domain: "localhost:3333",
};
var client = mongoRT.initializeApp(config);
```


## API

## Db
