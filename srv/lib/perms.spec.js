const Perms = require('./perms');
const { expect } = require('chai');

describe('perms', () => {
  it('should return rules', () => {
    const perms = new Perms({});
    const rules = perms.rules('cln');
    expect(rules).to.not.equal(null);
  });
});
