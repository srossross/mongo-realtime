const update = require('immutability-helper');


update.extend('$prefix', (prefix, original) => {
  const result = {};
  Object.keys(original).forEach((key) => {
    if (key.startsWith('$')) {
      throw new Error(`$prefix operator does not know how to prefix query key ${key} with ${prefix}`);
    }
    result[`${prefix}.${key}`] = original[key];
  });
  return result;
});

module.exports = update;
