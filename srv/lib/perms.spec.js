import { expect } from 'chai';
import Perms from './perms';

describe('perms', () => {
  it('should return rules', () => {
    const perms = new Perms({});
    const rule = perms.rule('collection', {}, 'op');
    expect(rule).to.be.an('object');
    expect(rule.valid()).to.equal(false);
  });

  it('can return a valid rule', () => {
    const perms = new Perms({
      collection: { op: true },
    });
    const rule = perms.rule('collection', {}, 'op');
    expect(rule.valid()).to.equal(true);
  });

  it('can evaluate an exression', () => {
    const perms = new Perms({
      collection: { op: 'user.x === "hello"' },
    });

    let rule = perms.rule('collection', { x: 'hello' }, 'op');
    expect(rule.valid()).to.equal(true);
    expect(rule.result()).to.equal(true);

    rule = perms.rule('collection', { x: 'goodbye' }, 'op');
    expect(rule.valid()).to.equal(true);
    expect(rule.result()).to.equal(false);
  });

  it('can handle an error in exression', () => {
    const perms = new Perms({
      collection: { op: ' syntax error here" ' },
    });

    const rule = perms.rule('collection', { x: 'hello' }, 'op');
    expect(rule.valid()).to.equal(true);
    expect(rule.result()).to.equal(false);
  });
});
