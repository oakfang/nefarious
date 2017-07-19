const test = require("..");

async function foo() {
  return 7;
}

test.export("This should not run on direct invocation", async t =>
  t.is(await foo(), 7)
);

module.exports = foo;
