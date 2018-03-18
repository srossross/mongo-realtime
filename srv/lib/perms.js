import _ from 'lodash';

const micromatch = require('micromatch');
const safeEval = require('safe-eval');
const debug = require('debug')('mongo-realtime:perms');

function matchingKeys(obj, toMatch) {
  const keys = Object.keys(obj)
    .filter(key => micromatch.isMatch(toMatch, key));
  keys.sort((a, b) => b.length - a.length);
  return keys;
}

class Rule {
  constructor(collection, user, op, rule) {
    this.collection = collection;
    this.rule = rule;
    this.user = {};
  }

  valid() {
    return !!this.rule;
  }

  result(ctx) {
    return safeEval(this.rule, Object.assign({ user: this.user }, ctx));
  }
}

class Perms {
  constructor(permData) {
    this.permData = permData;
  }

  rule(collection, user, op) {
    const matchingCollections = matchingKeys(this.permData, collection);
    debug('matchingCollections', matchingCollections);

    const rules = _.flatMap(matchingCollections, (r) => {
      const matchingOps = matchingKeys(this.permData[r], op);
      debug('matchingOps', matchingOps);
      return matchingOps.map(op1 => this.permData[r][op1]);
    });

    const rule = rules[0];
    return new Rule(collection, user, op, rule);
  }
}

module.exports = Perms;
