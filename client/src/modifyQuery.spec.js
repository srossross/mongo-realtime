const update = require('./modifyQuery');
const { expect } = require('chai');

describe('modifyQuery', () => {
  it('can prefix a query with a value', () => {
    const query = update({ x: 1 }, { $prefix: 'fullDocument' });
    expect(query).to.deep.equal({ 'fullDocument.x': 1 });
  });
});
