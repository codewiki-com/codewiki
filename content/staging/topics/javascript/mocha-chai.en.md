---
title: Mocha + Chai Testing Framework
description: Master Mocha and Chai for writing expressive and comprehensive JavaScript tests
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - Mocha
  - Chai
  - Testing
  - Unit Testing
  - TDD
  - BDD
  - Assertions
status: imported
origin: old/src/content/docs/javascript/mocha-chai.en.md
divergence: 0.213
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: JavaScript
  subcategory: ""
  order: null
  lastUpdated: 2026-01-22
---

Mocha is a flexible JavaScript testing framework that runs on Node.js and in the browser. Chai is an assertion library that pairs perfectly with Mocha, providing multiple assertion styles. Together, they form one of the most popular testing combinations in the JavaScript ecosystem, known for their flexibility and expressive syntax.

## Why Mocha + Chai

| Feature | Mocha | Chai | Together |
|---------|-------|------|----------|
| Test Runner | Yes | No | Complete testing solution |
| Assertions | No (built-in) | Yes | Expressive, readable tests |
| Async Support | Yes (callbacks, promises, async/await) | N/A | Modern async testing |
| Flexibility | Highly configurable | Multiple assertion styles | Adaptable to any style |
| Browser Support | Yes | Yes | Full stack testing |

### Assertion Styles Comparison

```javascript
// Chai Assert Style (similar to Node's assert)
assert.equal(actual, expected);
assert.strictEqual(actual, expected);
assert.deepEqual(actual, expected);

// Chai Expect Style (BDD)
expect(actual).to.equal(expected);
expect(actual).to.deep.equal(expected);
expect(actual).to.be.a('string');

// Chai Should Style (BDD)
actual.should.equal(expected);
actual.should.be.a('string');
actual.should.have.property('name');
```

## Getting Started

### Installation

```bash
# Install Mocha and Chai
npm install --save-dev mocha chai

# For TypeScript support
npm install --save-dev @types/mocha @types/chai ts-node

# Popular plugins
npm install --save-dev chai-as-promised  # Promise assertions
npm install --save-dev sinon sinon-chai  # Mocking and spies
npm install --save-dev chai-http         # HTTP testing
```

### Basic Configuration

```json
// package.json
{
  "scripts": {
    "test": "mocha",
    "test:watch": "mocha --watch",
    "test:coverage": "nyc mocha"
  }
}
```

```javascript
// .mocharc.js
module.exports = {
  // Test file patterns
  spec: ['test/**/*.test.js', 'test/**/*.spec.js'],

  // Timeout for each test
  timeout: 5000,

  // Reporter
  reporter: 'spec',

  // Enable colors
  color: true,

  // Bail on first failure
  bail: false,

  // Require files before running tests
  require: ['./test/setup.js'],

  // Watch files
  watchFiles: ['src/**/*.js', 'test/**/*.js'],

  // Parallel execution
  parallel: true,
  jobs: 4,

  // Retry failed tests
  retries: 2,
};
```

```javascript
// .mocharc.json (alternative)
{
  "spec": "test/**/*.test.js",
  "timeout": 5000,
  "reporter": "spec",
  "require": ["./test/setup.js"]
}
```

### TypeScript Configuration

```javascript
// .mocharc.js for TypeScript
module.exports = {
  extension: ['ts'],
  spec: 'test/**/*.test.ts',
  require: ['ts-node/register'],
};
```

```json
// tsconfig.json additions
{
  "compilerOptions": {
    "types": ["mocha", "chai", "node"]
  }
}
```

### Test Setup File

```javascript
// test/setup.js
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

// Use plugins
chai.use(chaiAsPromised);
chai.use(sinonChai);

// Global assertion style
global.expect = chai.expect;
global.should = chai.should();

// Environment setup
process.env.NODE_ENV = 'test';
```

## Writing Tests

### Basic Test Structure

```javascript
const { expect } = require('chai');

// Test suite
describe('Array', function() {
  // Nested suite
  describe('#indexOf()', function() {
    // Individual test
    it('should return -1 when value is not present', function() {
      expect([1, 2, 3].indexOf(4)).to.equal(-1);
    });

    it('should return the index when value is present', function() {
      expect([1, 2, 3].indexOf(2)).to.equal(1);
    });
  });

  describe('#length', function() {
    it('should return the number of elements', function() {
      expect([1, 2, 3]).to.have.lengthOf(3);
    });
  });
});
```

### Lifecycle Hooks

```javascript
describe('Database Operations', function() {
  let db;
  let testData;

  // Run once before all tests in this suite
  before(async function() {
    db = await Database.connect();
  });

  // Run once after all tests in this suite
  after(async function() {
    await db.disconnect();
  });

  // Run before each test
  beforeEach(async function() {
    testData = await db.seed();
  });

  // Run after each test
  afterEach(async function() {
    await db.cleanup();
  });

  it('should insert data', async function() {
    const result = await db.insert({ name: 'Test' });
    expect(result.id).to.exist;
  });

  it('should find data', async function() {
    const result = await db.find(testData.id);
    expect(result).to.deep.equal(testData);
  });
});
```

### Async Testing

```javascript
const { expect } = require('chai');

describe('Async Operations', function() {
  // Using async/await (recommended)
  it('should fetch user data', async function() {
    const user = await fetchUser(1);
    expect(user.name).to.equal('John');
  });

  // Using Promises
  it('should resolve with user data', function() {
    return fetchUser(1).then(user => {
      expect(user.name).to.equal('John');
    });
  });

  // Using done callback (legacy)
  it('should call back with user data', function(done) {
    fetchUser(1, (err, user) => {
      expect(err).to.be.null;
      expect(user.name).to.equal('John');
      done();
    });
  });

  // Testing rejected promises
  it('should reject for invalid user', async function() {
    try {
      await fetchUser(-1);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Invalid user ID');
    }
  });

  // With chai-as-promised
  it('should eventually equal user data', function() {
    return expect(fetchUser(1)).to.eventually.have.property('name', 'John');
  });

  it('should be rejected with error', function() {
    return expect(fetchUser(-1)).to.be.rejectedWith('Invalid user ID');
  });
});
```

### Test Modifiers

```javascript
describe('Test Modifiers', function() {
  // Skip a test
  it.skip('should be skipped', function() {
    // This test won't run
  });

  // Run only this test
  it.only('should run exclusively', function() {
    // Only this test runs in the suite
  });

  // Pending test (no implementation)
  it('should be implemented later');

  // Retry failed tests
  it('should eventually succeed', function() {
    this.retries(3);
    // May fail initially but succeeds on retry
  });

  // Custom timeout
  it('should complete within 10 seconds', function() {
    this.timeout(10000);
    // Long-running test
  });

  // Disable timeout
  it('can take as long as needed', function() {
    this.timeout(0);
    // Very long-running test
  });
});

// Skip entire suite
describe.skip('Skipped Suite', function() {
  // All tests skipped
});

// Run only this suite
describe.only('Exclusive Suite', function() {
  // Only tests in this suite run
});
```

## Chai Assertions

### Expect Style (Recommended)

```javascript
const { expect } = require('chai');

describe('Chai Expect Assertions', function() {
  // Equality
  it('should check equality', function() {
    expect(1 + 1).to.equal(2);
    expect('hello').to.equal('hello');
    expect({ a: 1 }).to.deep.equal({ a: 1 });
    expect([1, 2]).to.eql([1, 2]); // Alias for deep.equal
  });

  // Type checking
  it('should check types', function() {
    expect('test').to.be.a('string');
    expect(42).to.be.a('number');
    expect([]).to.be.an('array');
    expect({}).to.be.an('object');
    expect(null).to.be.null;
    expect(undefined).to.be.undefined;
    expect(true).to.be.true;
    expect(false).to.be.false;
  });

  // Truthiness
  it('should check truthiness', function() {
    expect('non-empty').to.be.ok;
    expect(0).to.not.be.ok;
    expect(true).to.be.true;
    expect(false).to.be.false;
  });

  // Numeric comparisons
  it('should compare numbers', function() {
    expect(10).to.be.above(5);
    expect(5).to.be.below(10);
    expect(5).to.be.at.least(5);
    expect(5).to.be.at.most(5);
    expect(5).to.be.within(1, 10);
    expect(5.5).to.be.closeTo(5, 0.6);
  });

  // String assertions
  it('should check strings', function() {
    expect('hello world').to.include('world');
    expect('hello world').to.match(/^hello/);
    expect('hello').to.have.lengthOf(5);
    expect('').to.be.empty;
  });

  // Array assertions
  it('should check arrays', function() {
    expect([1, 2, 3]).to.include(2);
    expect([1, 2, 3]).to.have.members([3, 2, 1]);
    expect([1, 2, 3]).to.include.members([1, 2]);
    expect([1, 2, 3]).to.have.ordered.members([1, 2, 3]);
    expect([1, 2, 3]).to.have.lengthOf(3);
    expect([]).to.be.empty;
    expect([{ a: 1 }]).to.deep.include({ a: 1 });
  });

  // Object assertions
  it('should check objects', function() {
    const obj = { name: 'John', age: 30, city: 'NYC' };

    expect(obj).to.have.property('name');
    expect(obj).to.have.property('name', 'John');
    expect(obj).to.have.keys(['name', 'age', 'city']);
    expect(obj).to.include.keys('name', 'age');
    expect(obj).to.have.all.keys('name', 'age', 'city');
    expect(obj).to.have.any.keys('name', 'other');
    expect(obj).to.include({ name: 'John' });
    expect(obj).to.deep.include({ name: 'John' });
  });

  // Nested property
  it('should check nested properties', function() {
    const obj = { user: { name: 'John', address: { city: 'NYC' } } };

    expect(obj).to.have.nested.property('user.name', 'John');
    expect(obj).to.have.nested.property('user.address.city', 'NYC');
    expect(obj).to.nested.include({ 'user.name': 'John' });
  });

  // Function assertions
  it('should check functions', function() {
    const fn = () => { throw new Error('Something went wrong'); };

    expect(fn).to.throw();
    expect(fn).to.throw(Error);
    expect(fn).to.throw('Something went wrong');
    expect(fn).to.throw(/went wrong/);

    const goodFn = () => 'success';
    expect(goodFn).to.not.throw();
  });

  // Date assertions
  it('should check dates', function() {
    const date = new Date('2024-01-15');
    expect(date).to.be.instanceOf(Date);
    expect(date.getFullYear()).to.equal(2024);
  });

  // Negation
  it('should support negation', function() {
    expect(1).to.not.equal(2);
    expect([]).to.not.include(1);
    expect({}).to.not.have.property('name');
    expect('hello').to.not.be.empty;
  });

  // Chaining
  it('should support chaining', function() {
    expect({ name: 'John', age: 30 })
      .to.be.an('object')
      .that.has.property('name')
      .that.equals('John');

    expect([1, 2, 3])
      .to.be.an('array')
      .that.includes(2)
      .and.has.lengthOf(3);
  });
});
```

### Should Style

```javascript
const chai = require('chai');
chai.should();

describe('Chai Should Assertions', function() {
  it('should use should style', function() {
    const name = 'John';
    const age = 30;
    const obj = { a: 1, b: 2 };

    name.should.be.a('string');
    name.should.equal('John');
    name.should.have.lengthOf(4);

    age.should.be.a('number');
    age.should.be.above(20);
    age.should.be.within(25, 35);

    obj.should.be.an('object');
    obj.should.have.property('a');
    obj.should.deep.equal({ a: 1, b: 2 });
  });

  // Note: should style doesn't work on null/undefined
  it('should handle null/undefined', function() {
    const value = null;
    // value.should.be.null;  // This would throw!

    // Use expect for null/undefined
    chai.expect(value).to.be.null;

    // Or use should.exist
    chai.should().not.exist(value);
  });
});
```

### Assert Style

```javascript
const { assert } = require('chai');

describe('Chai Assert Style', function() {
  it('should use assert style', function() {
    assert.equal(1 + 1, 2);
    assert.strictEqual(1 + 1, 2);
    assert.notEqual(1, 2);

    assert.deepEqual({ a: 1 }, { a: 1 });
    assert.notDeepEqual({ a: 1 }, { a: 2 });

    assert.isTrue(true);
    assert.isFalse(false);
    assert.isNull(null);
    assert.isNotNull('value');
    assert.isUndefined(undefined);
    assert.isDefined('value');

    assert.isOk('truthy');
    assert.isNotOk(0);

    assert.isArray([1, 2, 3]);
    assert.isObject({ a: 1 });
    assert.isFunction(() => {});
    assert.isString('hello');
    assert.isNumber(42);
    assert.isBoolean(true);

    assert.typeOf('hello', 'string');
    assert.instanceOf(new Date(), Date);

    assert.include([1, 2, 3], 2);
    assert.notInclude([1, 2, 3], 4);

    assert.match('hello', /^hel/);
    assert.notMatch('hello', /^world/);

    assert.property({ a: 1 }, 'a');
    assert.notProperty({ a: 1 }, 'b');
    assert.propertyVal({ a: 1 }, 'a', 1);

    assert.lengthOf([1, 2, 3], 3);
    assert.lengthOf('hello', 5);

    assert.throws(() => { throw new Error('fail'); });
    assert.doesNotThrow(() => 'success');
  });
});
```

## Mocking with Sinon

```javascript
const sinon = require('sinon');
const { expect } = require('chai');

describe('Sinon Mocking', function() {
  // Spies - observe function calls
  describe('Spies', function() {
    it('should track function calls', function() {
      const spy = sinon.spy();

      spy('hello');
      spy('world');

      expect(spy.calledTwice).to.be.true;
      expect(spy.firstCall.args[0]).to.equal('hello');
      expect(spy.secondCall.args[0]).to.equal('world');
    });

    it('should spy on object methods', function() {
      const obj = {
        greet(name) {
          return `Hello, ${name}!`;
        }
      };

      const spy = sinon.spy(obj, 'greet');

      const result = obj.greet('John');

      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith('John')).to.be.true;
      expect(result).to.equal('Hello, John!');

      spy.restore();
    });
  });

  // Stubs - replace function implementation
  describe('Stubs', function() {
    it('should stub return values', function() {
      const stub = sinon.stub();

      stub.returns(42);
      expect(stub()).to.equal(42);

      stub.onCall(0).returns('first');
      stub.onCall(1).returns('second');
      stub.reset();

      expect(stub()).to.equal('first');
      expect(stub()).to.equal('second');
    });

    it('should stub object methods', function() {
      const api = {
        fetchUser(id) {
          // Real implementation
        }
      };

      const stub = sinon.stub(api, 'fetchUser');
      stub.resolves({ id: 1, name: 'John' });

      return api.fetchUser(1).then(user => {
        expect(user.name).to.equal('John');
        stub.restore();
      });
    });

    it('should stub with conditions', function() {
      const stub = sinon.stub();

      stub.withArgs(1).returns('one');
      stub.withArgs(2).returns('two');
      stub.returns('default');

      expect(stub(1)).to.equal('one');
      expect(stub(2)).to.equal('two');
      expect(stub(3)).to.equal('default');
    });
  });

  // Mocks - pre-programmed expectations
  describe('Mocks', function() {
    it('should verify expectations', function() {
      const obj = {
        method() {}
      };

      const mock = sinon.mock(obj);
      mock.expects('method').once().withArgs('hello');

      obj.method('hello');

      mock.verify();
      mock.restore();
    });
  });

  // Fake timers
  describe('Fake Timers', function() {
    let clock;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
    });

    it('should control time', function() {
      const spy = sinon.spy();

      setTimeout(spy, 1000);

      expect(spy.called).to.be.false;

      clock.tick(1000);

      expect(spy.calledOnce).to.be.true;
    });

    it('should handle intervals', function() {
      const spy = sinon.spy();

      setInterval(spy, 100);

      clock.tick(250);

      expect(spy.calledTwice).to.be.true;
    });

    it('should mock Date', function() {
      clock = sinon.useFakeTimers(new Date('2024-01-15'));

      expect(new Date().toISOString()).to.include('2024-01-15');
    });
  });

  // Fake server (XHR)
  describe('Fake Server', function() {
    let server;

    beforeEach(function() {
      server = sinon.createFakeServer();
    });

    afterEach(function() {
      server.restore();
    });

    it('should mock HTTP requests', function(done) {
      server.respondWith('GET', '/api/users', [
        200,
        { 'Content-Type': 'application/json' },
        JSON.stringify([{ id: 1, name: 'John' }])
      ]);

      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/users');
      xhr.onload = function() {
        const data = JSON.parse(xhr.responseText);
        expect(data[0].name).to.equal('John');
        done();
      };
      xhr.send();

      server.respond();
    });
  });
});
```

## Chai Plugins

### chai-as-promised

```javascript
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const { expect } = chai;

describe('chai-as-promised', function() {
  it('should assert on fulfilled promises', async function() {
    const promise = Promise.resolve({ name: 'John' });

    await expect(promise).to.eventually.have.property('name', 'John');
    await expect(promise).to.eventually.deep.equal({ name: 'John' });
    await expect(promise).to.be.fulfilled;
  });

  it('should assert on rejected promises', async function() {
    const promise = Promise.reject(new Error('Failed'));

    await expect(promise).to.be.rejected;
    await expect(promise).to.be.rejectedWith(Error);
    await expect(promise).to.be.rejectedWith('Failed');
    await expect(promise).to.be.rejectedWith(/fail/i);
  });

  it('should chain assertions', async function() {
    const promise = Promise.resolve([1, 2, 3]);

    await expect(promise)
      .to.eventually.be.an('array')
      .that.includes(2)
      .and.has.lengthOf(3);
  });
});
```

### sinon-chai

```javascript
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const { expect } = chai;

describe('sinon-chai', function() {
  it('should provide cleaner spy assertions', function() {
    const spy = sinon.spy();

    spy('hello', 'world');

    expect(spy).to.have.been.called;
    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith('hello', 'world');
    expect(spy).to.have.been.calledWithExactly('hello', 'world');
  });

  it('should assert on call order', function() {
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();

    spy1();
    spy2();

    expect(spy1).to.have.been.calledBefore(spy2);
    expect(spy2).to.have.been.calledAfter(spy1);
  });

  it('should assert on stub behavior', function() {
    const stub = sinon.stub().returns(42);

    stub();

    expect(stub).to.have.been.called;
    expect(stub).to.have.returned(42);
  });
});
```

### chai-http

```javascript
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const { expect } = chai;

const app = require('../src/app'); // Express app

describe('HTTP API', function() {
  it('should GET all users', function(done) {
    chai.request(app)
      .get('/api/users')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('should POST a new user', function(done) {
    chai.request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com' })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        expect(res.body.name).to.equal('John');
        done();
      });
  });

  it('should handle authentication', function(done) {
    chai.request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer token123')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  // Using async/await
  it('should GET user by ID', async function() {
    const res = await chai.request(app)
      .get('/api/users/1');

    expect(res).to.have.status(200);
    expect(res.body).to.have.property('name');
  });
});
```

## Advanced Patterns

### Custom Assertions

```javascript
const chai = require('chai');
const { Assertion } = chai;

// Add custom assertion method
Assertion.addMethod('validEmail', function() {
  const email = this._obj;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  this.assert(
    emailRegex.test(email),
    'expected #{this} to be a valid email',
    'expected #{this} to not be a valid email'
  );
});

// Add chainable method
Assertion.addChainableMethod('withStatus', function(status) {
  const response = this._obj;

  this.assert(
    response.status === status,
    'expected response to have status #{exp} but got #{act}',
    'expected response to not have status #{act}',
    status,
    response.status
  );
});

// Usage
describe('Custom Assertions', function() {
  it('should validate email', function() {
    expect('john@example.com').to.be.validEmail;
    expect('invalid').to.not.be.validEmail;
  });

  it('should check response status', function() {
    const response = { status: 200, body: {} };
    expect(response).to.have.withStatus(200);
  });
});
```

### Test Data Factories

```javascript
// test/factories/userFactory.js
let idCounter = 0;

function createUser(overrides = {}) {
  idCounter++;
  return {
    id: idCounter,
    name: `User ${idCounter}`,
    email: `user${idCounter}@example.com`,
    role: 'user',
    createdAt: new Date(),
    ...overrides
  };
}

function createAdmin(overrides = {}) {
  return createUser({ role: 'admin', ...overrides });
}

function createUsers(count, overrides = {}) {
  return Array.from({ length: count }, () => createUser(overrides));
}

module.exports = { createUser, createAdmin, createUsers };

// Usage in tests
const { createUser, createAdmin, createUsers } = require('./factories/userFactory');

describe('User Service', function() {
  it('should process regular user', function() {
    const user = createUser();
    // Test with user
  });

  it('should grant admin privileges', function() {
    const admin = createAdmin({ name: 'Super Admin' });
    expect(admin.role).to.equal('admin');
  });

  it('should handle multiple users', function() {
    const users = createUsers(5);
    expect(users).to.have.lengthOf(5);
  });
});
```

### Testing Events

```javascript
const { expect } = require('chai');
const EventEmitter = require('events');

describe('Event Testing', function() {
  it('should test event emission', function(done) {
    const emitter = new EventEmitter();

    emitter.on('data', (value) => {
      expect(value).to.equal(42);
      done();
    });

    emitter.emit('data', 42);
  });

  it('should test multiple events', function(done) {
    const emitter = new EventEmitter();
    const events = [];

    emitter.on('start', () => events.push('start'));
    emitter.on('data', (v) => events.push(`data:${v}`));
    emitter.on('end', () => {
      events.push('end');
      expect(events).to.deep.equal(['start', 'data:1', 'data:2', 'end']);
      done();
    });

    emitter.emit('start');
    emitter.emit('data', 1);
    emitter.emit('data', 2);
    emitter.emit('end');
  });

  it('should test error events', function() {
    const emitter = new EventEmitter();

    expect(() => {
      emitter.emit('error', new Error('Test error'));
    }).to.throw('Test error');
  });
});
```

### Testing Streams

```javascript
const { expect } = require('chai');
const { Readable, Writable, Transform } = require('stream');

describe('Stream Testing', function() {
  it('should test readable stream', function(done) {
    const chunks = [];
    const readable = Readable.from(['hello', ' ', 'world']);

    readable.on('data', chunk => chunks.push(chunk));
    readable.on('end', () => {
      expect(chunks.join('')).to.equal('hello world');
      done();
    });
  });

  it('should test transform stream', function(done) {
    const uppercase = new Transform({
      transform(chunk, encoding, callback) {
        this.push(chunk.toString().toUpperCase());
        callback();
      }
    });

    const chunks = [];

    uppercase.on('data', chunk => chunks.push(chunk.toString()));
    uppercase.on('end', () => {
      expect(chunks.join('')).to.equal('HELLO WORLD');
      done();
    });

    uppercase.write('hello ');
    uppercase.write('world');
    uppercase.end();
  });
});
```

## Best Practices

### 1. Descriptive Test Names

```javascript
// BAD
it('test 1', function() {});
it('works', function() {});

// GOOD
it('should return -1 when searching for non-existent element', function() {});
it('should throw ValidationError when email format is invalid', function() {});
it('should increase cart total when adding product', function() {});
```

### 2. AAA Pattern

```javascript
describe('Calculator', function() {
  it('should add two positive numbers', function() {
    // Arrange
    const calculator = new Calculator();
    const a = 5;
    const b = 3;

    // Act
    const result = calculator.add(a, b);

    // Assert
    expect(result).to.equal(8);
  });
});
```

### 3. One Assertion Focus

```javascript
// BAD: Multiple unrelated assertions
it('should work correctly', function() {
  const user = createUser();
  expect(user.name).to.exist;
  expect(user.age).to.be.above(0);
  expect(user.email).to.be.validEmail;
  expect(calculateTax(user)).to.equal(1000);
});

// GOOD: Focused assertions
describe('User', function() {
  it('should have a name', function() {
    const user = createUser();
    expect(user.name).to.exist;
  });

  it('should have a valid age', function() {
    const user = createUser();
    expect(user.age).to.be.above(0);
  });
});
```

### 4. Test Isolation

```javascript
describe('UserService', function() {
  let userService;
  let mockDb;

  beforeEach(function() {
    // Fresh instance for each test
    mockDb = createMockDb();
    userService = new UserService(mockDb);
  });

  afterEach(function() {
    // Clean up
    sinon.restore();
  });

  it('should not affect other tests', function() {
    userService.create({ name: 'Test' });
    // State is reset before next test
  });
});
```

### 5. Avoid Test Interdependence

```javascript
// BAD: Tests depend on each other
describe('Shopping Cart', function() {
  const cart = new ShoppingCart();

  it('should add item', function() {
    cart.add({ id: 1, price: 10 });
    expect(cart.items).to.have.lengthOf(1);
  });

  it('should calculate total', function() {
    // Depends on previous test!
    expect(cart.total).to.equal(10);
  });
});

// GOOD: Independent tests
describe('Shopping Cart', function() {
  let cart;

  beforeEach(function() {
    cart = new ShoppingCart();
  });

  it('should add item', function() {
    cart.add({ id: 1, price: 10 });
    expect(cart.items).to.have.lengthOf(1);
  });

  it('should calculate total', function() {
    cart.add({ id: 1, price: 10 });
    expect(cart.total).to.equal(10);
  });
});
```

## Interview Key Points

### Common Questions

**Q: What is the difference between Mocha and Chai?**

A: Mocha is a test runner that provides the structure for writing tests (describe, it, hooks). Chai is an assertion library that provides ways to verify test results (expect, should, assert). They work together: Mocha runs tests, Chai verifies expectations.

**Q: What are the three assertion styles in Chai?**

A:
1. **Assert**: Classic style, similar to Node.js assert - `assert.equal(a, b)`
2. **Expect**: BDD style, chainable - `expect(a).to.equal(b)`
3. **Should**: BDD style, extends Object prototype - `a.should.equal(b)`

**Q: How do you test asynchronous code in Mocha?**

A: Three ways:
1. `async/await` - Return a promise from an async function
2. Return a promise directly from the test
3. Use the `done` callback (legacy)

```javascript
// Preferred: async/await
it('should fetch data', async function() {
  const data = await fetchData();
  expect(data).to.exist;
});
```

**Q: What are spies, stubs, and mocks in Sinon?**

A:
- **Spies**: Observe function calls without changing behavior
- **Stubs**: Replace function implementation with predefined behavior
- **Mocks**: Pre-programmed with expectations, verify calls

### Testing Checklist

- [ ] Use descriptive test names
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Keep tests isolated and independent
- [ ] Clean up after each test (restore stubs, clear state)
- [ ] Handle async code properly
- [ ] Use appropriate assertion style consistently
- [ ] Mock external dependencies
- [ ] Test edge cases and error conditions

## Summary

Mocha and Chai provide a powerful, flexible testing solution for JavaScript. Key takeaways:

1. **Mocha**: Test runner with hooks and async support
2. **Chai**: Multiple assertion styles for different preferences
3. **Sinon**: Mocking, stubbing, and spying capabilities
4. **Plugins**: Extend functionality for promises, HTTP, etc.
5. **Flexibility**: Adaptable to any testing style or project

## Further Reading

- [Mocha Documentation](https://mochajs.org/)
- [Chai Documentation](https://www.chaijs.com/)
- [Sinon Documentation](https://sinonjs.org/)
- [chai-as-promised](https://www.chaijs.com/plugins/chai-as-promised/)
- [sinon-chai](https://github.com/domenic/sinon-chai)
