const Resource = require("shared-resource");
const test = require("..");

const sleep = t => new Promise(resolve => setTimeout(resolve, t));

async function foo() {
  await sleep(3000);
  return Resource.now[test.isTest] ? Resource.now.context.a : 1;
}

test.beforeEach(t => {
  t.context.a = 5;
});

test("A sync test", t => {
  t.is(2, 2);
  t.is(2, 1 + 1);
});

test("Async test", function*(t) {
  t.is(yield Promise.resolve(2), 2);
});

test("Awesome aware async test", async t => {
  t.is(await foo(), 5);
});

test("Failing test", t => t.fail("with a message"));

test("Erroring test", function*(t) {
  throw new Error("meow");
});

test("Placeholder test", t => t.pass());

test("Failing test 2", t => t.is(1, 2));

test("Complex test", t => {
  t.is(2, 1);
  t.isNot(2, 2);
  t.truthy();
  t.falsy([null]);
});

test("Serial test", t => t.is(2, 2)).then(test("phase 2", t => t.is(3, 3)));

const unpatch = test.patch({
  fs: { readFile: 5 }
});

test("Patch test", t => {
  let fs = require("fs");
  t.is(fs.readFile, 5);
  unpatch();
  fs = require("fs");
  t.isNot(fs.readFile, 5);
});
