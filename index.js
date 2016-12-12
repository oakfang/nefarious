const co = require('co');
const ora = require('ora');
const chalk = require('chalk');
const _ = require('lodash');

const resolveScenario = (scenario, t) => {
  if (scenario.constructor.name === 'GeneratorFunction') {
    return co.wrap(scenario)(t);
  }
  return Promise.resolve(t).then(scenario);
}

const failures = {};
const errors = {};
const running = new Set();

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
    get passed() {
      return passing;
    },
    pass() {
      // do nothing
    },
  };

  base.fail = addCheck(() => false, () => 'Explicit failure');
  base.is = addCheck((x, y) => x === y, (x, y) => `${x} is not ${y}`);
  base.isNot = addCheck((x, y) => x !== y, (x, y) => `${x} is ${y}`);
  base.truthy = addCheck(x => x, x => `${x} is not truthy`);
  base.falsy = addCheck(x => !x, x => `${x} is not falsy`);

  return base;
};

function report() {
  if (_.isEmpty(errors) && _.isEmpty(failures)) {
    console.log(chalk.green('All tests passed successfully'));
    return;
  }
  if (!_.isEmpty(failures)) {
    console.error(chalk.red('===========FAILURES============='));
    _.forEach(failures, (msgs, name) => msgs.forEach(msg =>
      console.error(chalk.red(`${name}: ${msg}`))
    ));
  }
  if (!_.isEmpty(errors)) {
    console.error(chalk.red('============ERRORS=============='));
    _.forEach(errors, (err, name) => {
      console.error(chalk.red(name));
      console.error(chalk.red(err));
    });
  }
  process.exit(1);
}

function test(testName, scenario) {
  const spinner = ora(testName).start();
  const t = testInstance(testName);
  running.add(t);
  return resolveScenario(scenario, t)
    .then(() => {
      if (t.passed) {
        spinner.succeed();
      } else {
        spinner.fail();
      }
    }).catch(e => {
      errors[testName] = e;
      spinner.fail();
    }).then(() => {
      running.delete(t);
      if (!running.size) report();
    });
}

module.exports = test;
