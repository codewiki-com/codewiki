---
title: Mocha + Chai 测试框架
description: 掌握 Mocha 和 Chai 编写表达力强且全面的 JavaScript 测试
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - Mocha
  - Chai
  - 测试
  - 单元测试
  - TDD
  - BDD
  - 断言
status: imported
origin: old/src/content/docs/javascript/mocha-chai.zh.md
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

Mocha 是一个灵活的 JavaScript 测试框架，可在 Node.js 和浏览器中运行。Chai 是一个与 Mocha 完美配合的断言库，提供多种断言风格。它们共同构成了 JavaScript 生态系统中最流行的测试组合之一，以灵活性和表达性语法著称。

## 为什么选择 Mocha + Chai

| 特性 | Mocha | Chai | 组合使用 |
|------|-------|------|----------|
| 测试运行器 | 是 | 否 | 完整的测试解决方案 |
| 断言 | 否（内置） | 是 | 表达力强、可读的测试 |
| 异步支持 | 是（回调、Promise、async/await） | 不适用 | 现代异步测试 |
| 灵活性 | 高度可配置 | 多种断言风格 | 适应任何风格 |
| 浏览器支持 | 是 | 是 | 全栈测试 |

### 断言风格对比

```javascript
// Chai Assert 风格（类似于 Node 的 assert）
assert.equal(actual, expected);
assert.strictEqual(actual, expected);
assert.deepEqual(actual, expected);

// Chai Expect 风格（BDD）
expect(actual).to.equal(expected);
expect(actual).to.deep.equal(expected);
expect(actual).to.be.a('string');

// Chai Should 风格（BDD）
actual.should.equal(expected);
actual.should.be.a('string');
actual.should.have.property('name');
```

## 入门指南

### 安装

```bash
# 安装 Mocha 和 Chai
npm install --save-dev mocha chai

# TypeScript 支持
npm install --save-dev @types/mocha @types/chai ts-node

# 常用插件
npm install --save-dev chai-as-promised  # Promise 断言
npm install --save-dev sinon sinon-chai  # 模拟和间谍
npm install --save-dev chai-http         # HTTP 测试
```

### 基本配置

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
  // 测试文件模式
  spec: ['test/**/*.test.js', 'test/**/*.spec.js'],

  // 每个测试的超时时间
  timeout: 5000,

  // 报告器
  reporter: 'spec',

  // 启用颜色
  color: true,

  // 第一个失败时中止
  bail: false,

  // 运行测试前需要的文件
  require: ['./test/setup.js'],

  // 监视文件
  watchFiles: ['src/**/*.js', 'test/**/*.js'],

  // 并行执行
  parallel: true,
  jobs: 4,

  // 重试失败的测试
  retries: 2,
};
```

### TypeScript 配置

```javascript
// .mocharc.js 用于 TypeScript
module.exports = {
  extension: ['ts'],
  spec: 'test/**/*.test.ts',
  require: ['ts-node/register'],
};
```

```json
// tsconfig.json 补充
{
  "compilerOptions": {
    "types": ["mocha", "chai", "node"]
  }
}
```

### 测试设置文件

```javascript
// test/setup.js
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

// 使用插件
chai.use(chaiAsPromised);
chai.use(sinonChai);

// 全局断言风格
global.expect = chai.expect;
global.should = chai.should();

// 环境设置
process.env.NODE_ENV = 'test';
```

## 编写测试

### 基本测试结构

```javascript
const { expect } = require('chai');

// 测试套件
describe('Array', function() {
  // 嵌套套件
  describe('#indexOf()', function() {
    // 单个测试
    it('当值不存在时应该返回 -1', function() {
      expect([1, 2, 3].indexOf(4)).to.equal(-1);
    });

    it('当值存在时应该返回索引', function() {
      expect([1, 2, 3].indexOf(2)).to.equal(1);
    });
  });

  describe('#length', function() {
    it('应该返回元素数量', function() {
      expect([1, 2, 3]).to.have.lengthOf(3);
    });
  });
});
```

### 生命周期钩子

```javascript
describe('数据库操作', function() {
  let db;
  let testData;

  // 在此套件中所有测试之前运行一次
  before(async function() {
    db = await Database.connect();
  });

  // 在此套件中所有测试之后运行一次
  after(async function() {
    await db.disconnect();
  });

  // 在每个测试之前运行
  beforeEach(async function() {
    testData = await db.seed();
  });

  // 在每个测试之后运行
  afterEach(async function() {
    await db.cleanup();
  });

  it('应该插入数据', async function() {
    const result = await db.insert({ name: 'Test' });
    expect(result.id).to.exist;
  });

  it('应该查找数据', async function() {
    const result = await db.find(testData.id);
    expect(result).to.deep.equal(testData);
  });
});
```

### 异步测试

```javascript
const { expect } = require('chai');

describe('异步操作', function() {
  // 使用 async/await（推荐）
  it('应该获取用户数据', async function() {
    const user = await fetchUser(1);
    expect(user.name).to.equal('John');
  });

  // 使用 Promise
  it('应该解析用户数据', function() {
    return fetchUser(1).then(user => {
      expect(user.name).to.equal('John');
    });
  });

  // 使用 done 回调（旧方式）
  it('应该通过回调返回用户数据', function(done) {
    fetchUser(1, (err, user) => {
      expect(err).to.be.null;
      expect(user.name).to.equal('John');
      done();
    });
  });

  // 测试拒绝的 Promise
  it('对于无效用户应该拒绝', async function() {
    try {
      await fetchUser(-1);
      expect.fail('应该抛出错误');
    } catch (error) {
      expect(error.message).to.include('无效的用户 ID');
    }
  });

  // 使用 chai-as-promised
  it('最终应该等于用户数据', function() {
    return expect(fetchUser(1)).to.eventually.have.property('name', 'John');
  });

  it('应该被拒绝并返回错误', function() {
    return expect(fetchUser(-1)).to.be.rejectedWith('无效的用户 ID');
  });
});
```

### 测试修饰符

```javascript
describe('测试修饰符', function() {
  // 跳过测试
  it.skip('应该被跳过', function() {
    // 这个测试不会运行
  });

  // 只运行这个测试
  it.only('应该独占运行', function() {
    // 套件中只有这个测试运行
  });

  // 待定测试（没有实现）
  it('稍后实现');

  // 重试失败的测试
  it('最终应该成功', function() {
    this.retries(3);
    // 可能最初失败但重试后成功
  });

  // 自定义超时
  it('应该在 10 秒内完成', function() {
    this.timeout(10000);
    // 长时间运行的测试
  });

  // 禁用超时
  it('可以运行任意长时间', function() {
    this.timeout(0);
    // 非常长时间运行的测试
  });
});

// 跳过整个套件
describe.skip('跳过的套件', function() {
  // 所有测试都被跳过
});

// 只运行这个套件
describe.only('独占套件', function() {
  // 只有这个套件中的测试运行
});
```

## Chai 断言

### Expect 风格（推荐）

```javascript
const { expect } = require('chai');

describe('Chai Expect 断言', function() {
  // 相等性
  it('应该检查相等性', function() {
    expect(1 + 1).to.equal(2);
    expect('hello').to.equal('hello');
    expect({ a: 1 }).to.deep.equal({ a: 1 });
    expect([1, 2]).to.eql([1, 2]); // deep.equal 的别名
  });

  // 类型检查
  it('应该检查类型', function() {
    expect('test').to.be.a('string');
    expect(42).to.be.a('number');
    expect([]).to.be.an('array');
    expect({}).to.be.an('object');
    expect(null).to.be.null;
    expect(undefined).to.be.undefined;
    expect(true).to.be.true;
    expect(false).to.be.false;
  });

  // 真值性
  it('应该检查真值性', function() {
    expect('非空').to.be.ok;
    expect(0).to.not.be.ok;
    expect(true).to.be.true;
    expect(false).to.be.false;
  });

  // 数值比较
  it('应该比较数值', function() {
    expect(10).to.be.above(5);
    expect(5).to.be.below(10);
    expect(5).to.be.at.least(5);
    expect(5).to.be.at.most(5);
    expect(5).to.be.within(1, 10);
    expect(5.5).to.be.closeTo(5, 0.6);
  });

  // 字符串断言
  it('应该检查字符串', function() {
    expect('hello world').to.include('world');
    expect('hello world').to.match(/^hello/);
    expect('hello').to.have.lengthOf(5);
    expect('').to.be.empty;
  });

  // 数组断言
  it('应该检查数组', function() {
    expect([1, 2, 3]).to.include(2);
    expect([1, 2, 3]).to.have.members([3, 2, 1]);
    expect([1, 2, 3]).to.include.members([1, 2]);
    expect([1, 2, 3]).to.have.ordered.members([1, 2, 3]);
    expect([1, 2, 3]).to.have.lengthOf(3);
    expect([]).to.be.empty;
    expect([{ a: 1 }]).to.deep.include({ a: 1 });
  });

  // 对象断言
  it('应该检查对象', function() {
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

  // 嵌套属性
  it('应该检查嵌套属性', function() {
    const obj = { user: { name: 'John', address: { city: 'NYC' } } };

    expect(obj).to.have.nested.property('user.name', 'John');
    expect(obj).to.have.nested.property('user.address.city', 'NYC');
    expect(obj).to.nested.include({ 'user.name': 'John' });
  });

  // 函数断言
  it('应该检查函数', function() {
    const fn = () => { throw new Error('出了点问题'); };

    expect(fn).to.throw();
    expect(fn).to.throw(Error);
    expect(fn).to.throw('出了点问题');
    expect(fn).to.throw(/出了/);

    const goodFn = () => 'success';
    expect(goodFn).to.not.throw();
  });

  // 日期断言
  it('应该检查日期', function() {
    const date = new Date('2024-01-15');
    expect(date).to.be.instanceOf(Date);
    expect(date.getFullYear()).to.equal(2024);
  });

  // 否定
  it('应该支持否定', function() {
    expect(1).to.not.equal(2);
    expect([]).to.not.include(1);
    expect({}).to.not.have.property('name');
    expect('hello').to.not.be.empty;
  });

  // 链式调用
  it('应该支持链式调用', function() {
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

### Should 风格

```javascript
const chai = require('chai');
chai.should();

describe('Chai Should 断言', function() {
  it('应该使用 should 风格', function() {
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

  // 注意：should 风格对 null/undefined 不起作用
  it('应该处理 null/undefined', function() {
    const value = null;
    // value.should.be.null;  // 这会抛出错误！

    // 对 null/undefined 使用 expect
    chai.expect(value).to.be.null;

    // 或使用 should.exist
    chai.should().not.exist(value);
  });
});
```

### Assert 风格

```javascript
const { assert } = require('chai');

describe('Chai Assert 风格', function() {
  it('应该使用 assert 风格', function() {
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

## 使用 Sinon 进行模拟

```javascript
const sinon = require('sinon');
const { expect } = require('chai');

describe('Sinon 模拟', function() {
  // 间谍 - 观察函数调用
  describe('间谍', function() {
    it('应该跟踪函数调用', function() {
      const spy = sinon.spy();

      spy('hello');
      spy('world');

      expect(spy.calledTwice).to.be.true;
      expect(spy.firstCall.args[0]).to.equal('hello');
      expect(spy.secondCall.args[0]).to.equal('world');
    });

    it('应该监视对象方法', function() {
      const obj = {
        greet(name) {
          return `你好，${name}！`;
        }
      };

      const spy = sinon.spy(obj, 'greet');

      const result = obj.greet('John');

      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith('John')).to.be.true;
      expect(result).to.equal('你好，John！');

      spy.restore();
    });
  });

  // 存根 - 替换函数实现
  describe('存根', function() {
    it('应该存根返回值', function() {
      const stub = sinon.stub();

      stub.returns(42);
      expect(stub()).to.equal(42);

      stub.onCall(0).returns('first');
      stub.onCall(1).returns('second');
      stub.reset();

      expect(stub()).to.equal('first');
      expect(stub()).to.equal('second');
    });

    it('应该存根对象方法', function() {
      const api = {
        fetchUser(id) {
          // 真实实现
        }
      };

      const stub = sinon.stub(api, 'fetchUser');
      stub.resolves({ id: 1, name: 'John' });

      return api.fetchUser(1).then(user => {
        expect(user.name).to.equal('John');
        stub.restore();
      });
    });

    it('应该带条件存根', function() {
      const stub = sinon.stub();

      stub.withArgs(1).returns('one');
      stub.withArgs(2).returns('two');
      stub.returns('default');

      expect(stub(1)).to.equal('one');
      expect(stub(2)).to.equal('two');
      expect(stub(3)).to.equal('default');
    });
  });

  // 模拟 - 预编程的期望
  describe('模拟', function() {
    it('应该验证期望', function() {
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

  // 假计时器
  describe('假计时器', function() {
    let clock;

    beforeEach(function() {
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
    });

    it('应该控制时间', function() {
      const spy = sinon.spy();

      setTimeout(spy, 1000);

      expect(spy.called).to.be.false;

      clock.tick(1000);

      expect(spy.calledOnce).to.be.true;
    });

    it('应该处理间隔', function() {
      const spy = sinon.spy();

      setInterval(spy, 100);

      clock.tick(250);

      expect(spy.calledTwice).to.be.true;
    });

    it('应该模拟 Date', function() {
      clock = sinon.useFakeTimers(new Date('2024-01-15'));

      expect(new Date().toISOString()).to.include('2024-01-15');
    });
  });
});
```

## Chai 插件

### chai-as-promised

```javascript
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const { expect } = chai;

describe('chai-as-promised', function() {
  it('应该对已完成的 Promise 断言', async function() {
    const promise = Promise.resolve({ name: 'John' });

    await expect(promise).to.eventually.have.property('name', 'John');
    await expect(promise).to.eventually.deep.equal({ name: 'John' });
    await expect(promise).to.be.fulfilled;
  });

  it('应该对被拒绝的 Promise 断言', async function() {
    const promise = Promise.reject(new Error('失败'));

    await expect(promise).to.be.rejected;
    await expect(promise).to.be.rejectedWith(Error);
    await expect(promise).to.be.rejectedWith('失败');
    await expect(promise).to.be.rejectedWith(/失败/i);
  });

  it('应该链式断言', async function() {
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
  it('应该提供更清晰的间谍断言', function() {
    const spy = sinon.spy();

    spy('hello', 'world');

    expect(spy).to.have.been.called;
    expect(spy).to.have.been.calledOnce;
    expect(spy).to.have.been.calledWith('hello', 'world');
    expect(spy).to.have.been.calledWithExactly('hello', 'world');
  });

  it('应该断言调用顺序', function() {
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();

    spy1();
    spy2();

    expect(spy1).to.have.been.calledBefore(spy2);
    expect(spy2).to.have.been.calledAfter(spy1);
  });

  it('应该断言存根行为', function() {
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

const app = require('../src/app'); // Express 应用

describe('HTTP API', function() {
  it('应该 GET 所有用户', function(done) {
    chai.request(app)
      .get('/api/users')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('array');
        done();
      });
  });

  it('应该 POST 新用户', function(done) {
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

  it('应该处理认证', function(done) {
    chai.request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer token123')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  // 使用 async/await
  it('应该通过 ID 获取用户', async function() {
    const res = await chai.request(app)
      .get('/api/users/1');

    expect(res).to.have.status(200);
    expect(res.body).to.have.property('name');
  });
});
```

## 高级模式

### 自定义断言

```javascript
const chai = require('chai');
const { Assertion } = chai;

// 添加自定义断言方法
Assertion.addMethod('validEmail', function() {
  const email = this._obj;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  this.assert(
    emailRegex.test(email),
    '期望 #{this} 是有效的邮箱',
    '期望 #{this} 不是有效的邮箱'
  );
});

// 添加可链式方法
Assertion.addChainableMethod('withStatus', function(status) {
  const response = this._obj;

  this.assert(
    response.status === status,
    '期望响应状态为 #{exp} 但得到 #{act}',
    '期望响应状态不是 #{act}',
    status,
    response.status
  );
});

// 使用
describe('自定义断言', function() {
  it('应该验证邮箱', function() {
    expect('john@example.com').to.be.validEmail;
    expect('invalid').to.not.be.validEmail;
  });

  it('应该检查响应状态', function() {
    const response = { status: 200, body: {} };
    expect(response).to.have.withStatus(200);
  });
});
```

### 测试数据工厂

```javascript
// test/factories/userFactory.js
let idCounter = 0;

function createUser(overrides = {}) {
  idCounter++;
  return {
    id: idCounter,
    name: `用户 ${idCounter}`,
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

// 在测试中使用
const { createUser, createAdmin, createUsers } = require('./factories/userFactory');

describe('用户服务', function() {
  it('应该处理普通用户', function() {
    const user = createUser();
    // 使用 user 测试
  });

  it('应该授予管理员权限', function() {
    const admin = createAdmin({ name: '超级管理员' });
    expect(admin.role).to.equal('admin');
  });

  it('应该处理多个用户', function() {
    const users = createUsers(5);
    expect(users).to.have.lengthOf(5);
  });
});
```

### 测试事件

```javascript
const { expect } = require('chai');
const EventEmitter = require('events');

describe('事件测试', function() {
  it('应该测试事件发射', function(done) {
    const emitter = new EventEmitter();

    emitter.on('data', (value) => {
      expect(value).to.equal(42);
      done();
    });

    emitter.emit('data', 42);
  });

  it('应该测试多个事件', function(done) {
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

  it('应该测试错误事件', function() {
    const emitter = new EventEmitter();

    expect(() => {
      emitter.emit('error', new Error('测试错误'));
    }).to.throw('测试错误');
  });
});
```

## 最佳实践

### 1. 描述性测试名称

```javascript
// 差
it('测试 1', function() {});
it('有效', function() {});

// 好
it('搜索不存在的元素时应该返回 -1', function() {});
it('邮箱格式无效时应该抛出 ValidationError', function() {});
it('添加产品时应该增加购物车总额', function() {});
```

### 2. AAA 模式

```javascript
describe('计算器', function() {
  it('应该相加两个正数', function() {
    // Arrange（准备）
    const calculator = new Calculator();
    const a = 5;
    const b = 3;

    // Act（执行）
    const result = calculator.add(a, b);

    // Assert（断言）
    expect(result).to.equal(8);
  });
});
```

### 3. 单一断言焦点

```javascript
// 差：多个不相关的断言
it('应该正确工作', function() {
  const user = createUser();
  expect(user.name).to.exist;
  expect(user.age).to.be.above(0);
  expect(user.email).to.be.validEmail;
  expect(calculateTax(user)).to.equal(1000);
});

// 好：聚焦的断言
describe('用户', function() {
  it('应该有名字', function() {
    const user = createUser();
    expect(user.name).to.exist;
  });

  it('应该有有效的年龄', function() {
    const user = createUser();
    expect(user.age).to.be.above(0);
  });
});
```

### 4. 测试隔离

```javascript
describe('UserService', function() {
  let userService;
  let mockDb;

  beforeEach(function() {
    // 每个测试的新实例
    mockDb = createMockDb();
    userService = new UserService(mockDb);
  });

  afterEach(function() {
    // 清理
    sinon.restore();
  });

  it('不应该影响其他测试', function() {
    userService.create({ name: 'Test' });
    // 状态在下一个测试之前重置
  });
});
```

### 5. 避免测试相互依赖

```javascript
// 差：测试相互依赖
describe('购物车', function() {
  const cart = new ShoppingCart();

  it('应该添加商品', function() {
    cart.add({ id: 1, price: 10 });
    expect(cart.items).to.have.lengthOf(1);
  });

  it('应该计算总额', function() {
    // 依赖于前一个测试！
    expect(cart.total).to.equal(10);
  });
});

// 好：独立的测试
describe('购物车', function() {
  let cart;

  beforeEach(function() {
    cart = new ShoppingCart();
  });

  it('应该添加商品', function() {
    cart.add({ id: 1, price: 10 });
    expect(cart.items).to.have.lengthOf(1);
  });

  it('应该计算总额', function() {
    cart.add({ id: 1, price: 10 });
    expect(cart.total).to.equal(10);
  });
});
```

## 面试要点

### 常见问题

**问：Mocha 和 Chai 有什么区别？**

答：Mocha 是测试运行器，提供编写测试的结构（describe、it、钩子）。Chai 是断言库，提供验证测试结果的方式（expect、should、assert）。它们协同工作：Mocha 运行测试，Chai 验证期望。

**问：Chai 中的三种断言风格是什么？**

答：
1. **Assert**：经典风格，类似 Node.js assert - `assert.equal(a, b)`
2. **Expect**：BDD 风格，可链式调用 - `expect(a).to.equal(b)`
3. **Should**：BDD 风格，扩展 Object 原型 - `a.should.equal(b)`

**问：如何在 Mocha 中测试异步代码？**

答：三种方式：
1. `async/await` - 从异步函数返回 promise
2. 直接从测试返回 promise
3. 使用 `done` 回调（旧方式）

```javascript
// 推荐：async/await
it('应该获取数据', async function() {
  const data = await fetchData();
  expect(data).to.exist;
});
```

**问：Sinon 中的间谍、存根和模拟是什么？**

答：
- **间谍**：观察函数调用而不改变行为
- **存根**：用预定义的行为替换函数实现
- **模拟**：预编程的期望，验证调用

### 测试检查清单

- [ ] 使用描述性测试名称
- [ ] 遵循 AAA 模式（Arrange、Act、Assert）
- [ ] 保持测试隔离和独立
- [ ] 每次测试后清理（恢复存根、清除状态）
- [ ] 正确处理异步代码
- [ ] 一致使用适当的断言风格
- [ ] 模拟外部依赖
- [ ] 测试边界情况和错误条件

## 总结

Mocha 和 Chai 为 JavaScript 提供了强大、灵活的测试解决方案。关键要点：

1. **Mocha**：带钩子和异步支持的测试运行器
2. **Chai**：多种断言风格满足不同偏好
3. **Sinon**：模拟、存根和间谍功能
4. **插件**：扩展 Promise、HTTP 等功能
5. **灵活性**：适应任何测试风格或项目

## 延伸阅读

- [Mocha 文档](https://mochajs.org/)
- [Chai 文档](https://www.chaijs.com/)
- [Sinon 文档](https://sinonjs.org/)
- [chai-as-promised](https://www.chaijs.com/plugins/chai-as-promised/)
- [sinon-chai](https://github.com/domenic/sinon-chai)
