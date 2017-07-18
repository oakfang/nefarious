const Module = require("module");
const co = require("co");
const ora = require("ora");
const chalk = require("chalk");
const Resource = require("shared-resource");
const _ = require("lodash");

const resolveScenario = (scenario, t) => {
  if (scenario.constructor.name === "GeneratorFunction") {
    return co.wrap(scenario)(t);
  }
  return Promise.resolve(t).then(scenario);
};

const failures = {};
const errors = {};
const before = [];
const after = [];
const running = new Set();
const isTest = Symbol('@@isTest');

const testInstance = name => {
  let passing = true;
  const addFailure = msg => {
    passing = false;
    if (!failures[name]) {
      failures[name] = [];
    }
    failures[name].push(msg);
  };

  const addCheck = (predicate, msgFactory) => (...args) => {
    const airity = predicate.length;
    let msg = msgFactory(...args.slice(0, airity));
    if (args.length > airity) {
      msg = args.pop();
    }
    if (!predicate(...args)) addFailure(msg);
  };

  const base = {
    context: {},
    get passed() {
      return passing;
    },
    pass() {
      // do nothing
    }
  };

  base.fail = addCheck(() => false, () => "Explicit failure");
  base.is = addCheck((x, y) => x === y, (x, y) => `${x} is not ${y}`);
  base.isNot = addCheck((x, y) => x !== y, (x, y) => `${x} is ${y}`);
  base.truthy = addCheck(x => x, x => `${x} is not truthy`);
  base.falsy = addCheck(x => !x, x => `${x} is not falsy`);

  return base;
};

function report() {
  if (_.isEmpty(errors) && _.isEmpty(failures)) {
    console.log(chalk.green("All tests passed successfully"));
    return;
  }
  if (!_.isEmpty(failures)) {
    console.error(chalk.red("===========FAILURES============="));
    _.forEach(failures, (msgs, name) =>
      msgs.forEach(msg => console.error(chalk.red(`${name}: ${msg}`)))
    );
  }
  if (!_.isEmpty(errors)) {
    console.error(chalk.red("============ERRORS=============="));
    _.forEach(errors, (err, name) => {
      console.error(chalk.red(name));
      console.error(chalk.red(err));
    });
  }
  process.exit(1);
}

const test = Resource.wrap(async (testName, scenario) => {
  const spinner = ora(testName).start();
  const t = testInstance(testName);
  Resource.now[isTest] = true;
  Resource.now.context = t.context;
  try {
    await Promise.resolve(before.map(fn => Promise.resolve(t).then(fn)));
    running.add(t);
    await resolveScenario(scenario, t);
    if (t.passed) {
      spinner.succeed();
    } else {
      spinner.fail();
    }
    await Promise.resolve(after.map(fn => Promise.resolve(t).then(fn)));
  } catch (e) {
    errors[testName] = e;
    spinner.fail();
  }
  running.delete(t);
  if (!running.size) report();
});

test.patch = patches => {
  const moduleCache = Module._cache;
  const resolved = Object.keys(patches).reduce((ms, m) => {
    ms[require.resolve(m)] = patches[m];
    return ms;
  }, {});
  Module._cache = new Proxy(moduleCache, {
    get(cache, resolvedModule) {
      const patch = resolved[resolvedModule];
      return patch ? { exports: patch } : cache[resolvedModule];
    }
  });
  return () => {
    Module._cache = moduleCache;
  };
};

test.beforeEach = fn => before.push(fn);
test.afterEach = fn => after.push(fn);
test.isTest = isTest;

module.exports = test;
