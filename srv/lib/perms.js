import _ from 'lodash';
import micromatch from 'micromatch';
import safeEval from 'safe-eval';

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
    this.user = user;
  }

  valid() {
    return !!this.rule;
  }

  result(ctx) {
    try {
      return safeEval(this.rule, Object.assign({ user: this.user }, ctx));
    } catch (err) {
      debug(`${this.rule} raised exception "${err.message}"`);
      return false;
    }
  }
}

export default class Perms {
  static RuleMap = {
    query: ['find', 'findOne', 'findAndModifyOne', 'findAndModify', 'watchID', 'watchQuery'],
    insert: ['insert', 'insertOne'],
    update: ['update', 'updateOne', 'findAndModifyOne', 'findAndModify'],
  };

  static hasQuery(op) {
    return Perms.RuleMap.query.indexOf(op) !== -1;
  }

  static hasInsert(op) {
    return Perms.RuleMap.insert.indexOf(op) !== -1;
  }

  static hasUpdate(op) {
    return Perms.RuleMap.insert.indexOf(op) !== -1;
  }

  constructor(permData) {
    this.permData = permData;
  }


  rules(collection, user) {
    const query = this.rule(collection, user, 'query');
    const update = this.rule(collection, user, 'update');
    const insert = this.rule(collection, user, 'insert');
    return { query, update, insert };
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
