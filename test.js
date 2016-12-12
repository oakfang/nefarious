const test = require('.');

test('A sync test', t => {
  t.is(2, 2);
  t.is(2, 1 + 1);
});

test('Async test', function* (t) {
  t.is((yield Promise.resolve(2)), 2);
});

test('Failing test', t => t.fail('with a message'));

test('Erroring test', function* (t) {
  throw new Error('meow');
});

test('Placeholder test', t => t.pass());

test('Failing test 2', t => t.is(1, 2));

test('Complex test', t => {
  t.is(2, 1);
  t.isNot(2, 2);
  t.truthy();
  t.falsy([null]);
});