# nefarious
Quick and easy testing library

## Intro
`nefarious` is an extremely simple testing library meant for inline use, no test-runner included.

## Example (test file)
```js
const test = require('nefarious');

const sleep = t => new Promise(resolve => setTimeout(resolve, t));

async function delayedIdentity(a, b) {
    await sleep(a);
    return b;
}

test('Basic test', async t => {
    t.is(await delayedIdentity(1000, 5), 5);
});
```

Running this file directly will run the tests and print a report.

## Example (inline testing)
```js
const test = require('nefarious');

function sum(arr) {
    return arr.reduce((s, c) => s + c, 0);
}

test.export('Sum of empty array is 0', t => {
    t.is(sum([]), 0);
});

test.export('Sum logic makes sense', t => {
    t.is(sum([1, 2, 3, 4]), 10);
});

module.exports = sum;
```

Simply running (or requiring) this file, won't run any tests.
However, this:

```js
const test = require('nefarious');
test.suite(() => [
    require('./src/sum');
]);
```

Will run the tests. Basically, use `test.suite` when you need to run multiple tests.

More features can be found in the *examples* directory.