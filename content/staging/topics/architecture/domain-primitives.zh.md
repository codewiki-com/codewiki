---
title: 领域原语
description: 学习使用领域原语提高代码质量
track: architecture
section: ddd
difficulty: intermediate
tags:
  - 领域原语
  - 值对象
  - 类型安全
  - DDD
status: imported
origin: old/src/content/docs/architecture/domain-primitives.zh.md
divergence: 0.219
issues:
  - title-lang-en
  - title-language
legacy:
  category: Architecture
  subcategory: DDD
  order: 25
  lastUpdated: 2026-01-07
---

## 概述

领域原语 (Domain Primitives) 是领域驱动设计 (DDD) 中的一个重要概念，它是对原始类型 (Primitive Types) 的领域化封装。领域原语将业务规则和验证逻辑封装在类型本身中，确保在系统的任何地方使用该类型时，其值始终是有效的。

领域原语的核心思想是：**让非法状态无法表示 (Make illegal states unrepresentable)**。

---

## 什么是领域原语

### 定义

领域原语是一种特殊的值对象，它：

1. **封装单一概念**：代表一个不可再分的业务概念
2. **自我验证**：在创建时验证数据的有效性
3. **不可变**：创建后状态不可改变
4. **类型安全**：提供强类型保证，避免参数混淆

### 领域原语 vs 值对象

虽然领域原语是值对象的一种，但它们有细微的区别：

| 特性 | 领域原语 | 值对象 |
|-----|---------|--------|
| 封装的概念 | 单一、原子概念 | 可以是复合概念 |
| 属性数量 | 通常只有一个核心属性 | 可以有多个属性 |
| 复杂度 | 简单 | 可以较复杂 |
| 示例 | EmailAddress, PhoneNumber | Address, Money, DateRange |

```typescript
// 领域原语：单一概念
class EmailAddress {
  constructor(private readonly value: string) {
    this.validate(value);
  }
}

// 值对象：复合概念
class Address {
  constructor(
    private readonly province: string,
    private readonly city: string,
    private readonly district: string,
    private readonly street: string
  ) {}
}
```

---

## 原始类型偏执反模式 (Primitive Obsession)

### 什么是原始类型偏执

原始类型偏执 (Primitive Obsession) 是一种常见的代码坏味道 (Code Smell)，指的是过度使用原始类型 (string、number、boolean 等) 来表示领域概念，而不是创建适当的领域类型。

### 原始类型偏执的问题

```typescript
// 充满原始类型偏执的代码
class UserService {
  createUser(
    name: string,
    email: string,
    phone: string,
    age: number,
    zipCode: string
  ): User {
    // 问题1：参数顺序容易搞混
    // 问题2：任何字符串都可以作为 email 传入
    // 问题3：验证逻辑散落在各处
    // 问题4：没有业务语义
    return new User(name, email, phone, age, zipCode);
  }
}

// 调用时很容易犯错
userService.createUser(
  "john@example.com",  // 错误：把 email 当成了 name
  "John Doe",          // 错误：把 name 当成了 email
  "12345",             // 这是 phone 还是 zipCode？
  25,
  "13800138000"        // 错误：把 phone 当成了 zipCode
);
```

### 原始类型偏执带来的问题

1. **参数混淆**：相同类型的参数容易传错位置
2. **验证分散**：数据验证逻辑散落在系统各处
3. **重复验证**：同一验证逻辑被重复实现多次
4. **缺乏语义**：代码无法表达业务意图
5. **难以重构**：修改验证规则需要在多处修改
6. **测试困难**：需要在每个使用点测试验证逻辑

---

## 领域原语的设计原则

### 自我验证 (Self-Validation)

领域原语在创建时必须验证自身的有效性，不允许创建无效的实例。

```typescript
class EmailAddress {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly value: string;

  constructor(value: string) {
    const trimmed = value?.trim().toLowerCase();

    if (!trimmed) {
      throw new InvalidEmailError('邮箱地址不能为空');
    }

    if (!EmailAddress.EMAIL_REGEX.test(trimmed)) {
      throw new InvalidEmailError(`无效的邮箱地址格式: ${value}`);
    }

    if (trimmed.length > 254) {
      throw new InvalidEmailError('邮箱地址长度不能超过254个字符');
    }

    this.value = trimmed;
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }
}
```

### 不可变性 (Immutability)

领域原语创建后不可修改，任何"修改"操作都返回新实例。

```typescript
class Quantity {
  private readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new InvalidQuantityError('数量必须是整数');
    }
    if (value < 0) {
      throw new InvalidQuantityError('数量不能为负数');
    }
    if (value > 10000) {
      throw new InvalidQuantityError('数量不能超过10000');
    }
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  // 不可变操作：返回新实例
  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  subtract(other: Quantity): Quantity {
    return new Quantity(this.value - other.value);
  }

  multiply(factor: number): Quantity {
    return new Quantity(Math.floor(this.value * factor));
  }

  isZero(): boolean {
    return this.value === 0;
  }
}
```

### 相等性 (Equality)

领域原语的相等性基于值判断，而非引用。

```typescript
class ProductId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new InvalidProductIdError('产品ID不能为空');
    }
    if (!/^PRD-[A-Z0-9]{8}$/.test(value)) {
      throw new InvalidProductIdError('产品ID格式无效');
    }
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ProductId | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  hashCode(): number {
    let hash = 0;
    for (let i = 0; i < this.value.length; i++) {
      const char = this.value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  toString(): string {
    return this.value;
  }

  // 工厂方法：生成新ID
  static generate(): ProductId {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'PRD-';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return new ProductId(id);
  }
}
```

### 富有表现力的 API

领域原语应该提供有意义的业务方法，而不仅仅是简单的 getter。

```typescript
class PhoneNumber {
  private readonly countryCode: string;
  private readonly nationalNumber: string;

  constructor(value: string) {
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    const parsed = this.parse(cleaned);

    this.countryCode = parsed.countryCode;
    this.nationalNumber = parsed.nationalNumber;
  }

  private parse(value: string): { countryCode: string; nationalNumber: string } {
    // 中国手机号
    if (/^(\+86|86)?1[3-9]\d{9}$/.test(value)) {
      const number = value.replace(/^(\+86|86)/, '');
      return { countryCode: '86', nationalNumber: number };
    }

    // 国际号码格式
    const match = value.match(/^\+(\d{1,3})(\d{6,14})$/);
    if (match) {
      return { countryCode: match[1], nationalNumber: match[2] };
    }

    throw new InvalidPhoneNumberError(`无效的电话号码: ${value}`);
  }

  // 业务方法：获取完整号码
  getFullNumber(): string {
    return `+${this.countryCode}${this.nationalNumber}`;
  }

  // 业务方法：获取显示格式
  getDisplayFormat(): string {
    if (this.countryCode === '86') {
      const n = this.nationalNumber;
      return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
    }
    return this.getFullNumber();
  }

  // 业务方法：判断是否为中国号码
  isChineseNumber(): boolean {
    return this.countryCode === '86';
  }

  // 业务方法：获取运营商类型（简化示例）
  getCarrierType(): string {
    if (!this.isChineseNumber()) {
      return 'UNKNOWN';
    }

    const prefix = this.nationalNumber.slice(0, 3);
    const mobilePrefix = ['134', '135', '136', '137', '138', '139', '150', '151', '152', '157', '158', '159', '182', '183', '184', '187', '188'];
    const unicomPrefix = ['130', '131', '132', '155', '156', '185', '186'];
    const telecomPrefix = ['133', '153', '180', '181', '189'];

    if (mobilePrefix.includes(prefix)) return 'CHINA_MOBILE';
    if (unicomPrefix.includes(prefix)) return 'CHINA_UNICOM';
    if (telecomPrefix.includes(prefix)) return 'CHINA_TELECOM';
    return 'OTHER';
  }

  // 业务方法：脱敏显示
  getMasked(): string {
    const n = this.nationalNumber;
    return `${n.slice(0, 3)}****${n.slice(-4)}`;
  }

  equals(other: PhoneNumber | null | undefined): boolean {
    if (!other) return false;
    return this.countryCode === other.countryCode &&
           this.nationalNumber === other.nationalNumber;
  }
}
```

---

## 常见领域原语实现

### 标识符类 (Identifiers)

```typescript
// 通用ID基类
abstract class Identifier<T extends string | number> {
  protected constructor(protected readonly value: T) {
    this.validate(value);
  }

  protected abstract validate(value: T): void;

  getValue(): T {
    return this.value;
  }

  equals(other: Identifier<T> | null | undefined): boolean {
    if (!other) return false;
    if (this.constructor !== other.constructor) return false;
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}

// 订单ID
class OrderId extends Identifier<string> {
  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new InvalidOrderIdError('订单ID不能为空');
    }
    if (!/^ORD-\d{14}-[A-Z0-9]{4}$/.test(value)) {
      throw new InvalidOrderIdError(`无效的订单ID格式: ${value}`);
    }
  }

  static generate(): OrderId {
    const timestamp = new Date().toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return new OrderId(`ORD-${timestamp}-${random}`);
  }

  // 从订单ID提取时间信息
  getCreatedDate(): Date {
    const timestampPart = this.value.slice(4, 18);
    const year = parseInt(timestampPart.slice(0, 4));
    const month = parseInt(timestampPart.slice(4, 6)) - 1;
    const day = parseInt(timestampPart.slice(6, 8));
    const hour = parseInt(timestampPart.slice(8, 10));
    const minute = parseInt(timestampPart.slice(10, 12));
    const second = parseInt(timestampPart.slice(12, 14));
    return new Date(year, month, day, hour, minute, second);
  }
}

// 用户ID
class UserId extends Identifier<string> {
  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new InvalidUserIdError('用户ID不能为空');
    }
    // UUID v4 格式
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw new InvalidUserIdError(`无效的用户ID格式: ${value}`);
    }
  }

  static generate(): UserId {
    const uuid = crypto.randomUUID();
    return new UserId(uuid);
  }
}
```

### 金额类 (Money)

```typescript
enum Currency {
  CNY = 'CNY',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY'
}

class Money {
  // 使用整数存储，避免浮点数精度问题
  // 对于CNY/USD/EUR存储分，对于JPY存储日元
  private readonly cents: number;
  private readonly currency: Currency;

  private constructor(cents: number, currency: Currency) {
    this.cents = cents;
    this.currency = currency;
  }

  // 从元创建
  static fromYuan(amount: number, currency: Currency = Currency.CNY): Money {
    if (!Number.isFinite(amount)) {
      throw new InvalidMoneyError('金额必须是有效数字');
    }

    const cents = Math.round(amount * 100);
    if (cents < 0) {
      throw new InvalidMoneyError('金额不能为负数');
    }

    return new Money(cents, currency);
  }

  // 从分创建
  static fromCents(cents: number, currency: Currency = Currency.CNY): Money {
    if (!Number.isInteger(cents)) {
      throw new InvalidMoneyError('分必须是整数');
    }
    if (cents < 0) {
      throw new InvalidMoneyError('金额不能为负数');
    }

    return new Money(cents, currency);
  }

  static zero(currency: Currency = Currency.CNY): Money {
    return new Money(0, currency);
  }

  // 获取元
  getAmount(): number {
    return this.cents / 100;
  }

  // 获取分
  getCents(): number {
    return this.cents;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  // 加法
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  // 减法
  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.cents - other.cents;
    if (result < 0) {
      throw new InvalidMoneyError('余额不足');
    }
    return new Money(result, this.currency);
  }

  // 乘法（用于计算税费、折扣等）
  multiply(factor: number): Money {
    const result = Math.round(this.cents * factor);
    return new Money(result, this.currency);
  }

  // 按比例分配（用于订单分摊等场景）
  allocate(ratios: number[]): Money[] {
    const total = ratios.reduce((sum, r) => sum + r, 0);
    let remainder = this.cents;
    const results: Money[] = [];

    for (let i = 0; i < ratios.length; i++) {
      const share = Math.floor(this.cents * ratios[i] / total);
      results.push(new Money(share, this.currency));
      remainder -= share;
    }

    // 将余数分配给第一个
    if (remainder > 0) {
      results[0] = new Money(results[0].cents + remainder, this.currency);
    }

    return results;
  }

  // 比较
  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.cents > other.cents;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.cents >= other.cents;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.cents < other.cents;
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  // 格式化显示
  format(locale: string = 'zh-CN'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency
    }).format(this.getAmount());
  }

  // 相等性
  equals(other: Money | null | undefined): boolean {
    if (!other) return false;
    return this.cents === other.cents && this.currency === other.currency;
  }

  toString(): string {
    return `${this.currency} ${this.getAmount().toFixed(2)}`;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(
        `货币类型不匹配: ${this.currency} 和 ${other.currency}`
      );
    }
  }
}
```

### 百分比类 (Percentage)

```typescript
class Percentage {
  private readonly value: number; // 存储为小数，如 0.15 表示 15%

  private constructor(value: number) {
    this.value = value;
  }

  // 从百分比值创建（输入15表示15%）
  static fromPercent(percent: number): Percentage {
    if (!Number.isFinite(percent)) {
      throw new InvalidPercentageError('百分比必须是有效数字');
    }
    if (percent < 0 || percent > 100) {
      throw new InvalidPercentageError('百分比必须在0-100之间');
    }
    return new Percentage(percent / 100);
  }

  // 从小数创建（输入0.15表示15%）
  static fromDecimal(decimal: number): Percentage {
    if (!Number.isFinite(decimal)) {
      throw new InvalidPercentageError('百分比必须是有效数字');
    }
    if (decimal < 0 || decimal > 1) {
      throw new InvalidPercentageError('小数形式的百分比必须在0-1之间');
    }
    return new Percentage(decimal);
  }

  static zero(): Percentage {
    return new Percentage(0);
  }

  static full(): Percentage {
    return new Percentage(1);
  }

  // 获取小数值
  toDecimal(): number {
    return this.value;
  }

  // 获取百分比值
  toPercent(): number {
    return this.value * 100;
  }

  // 应用到金额
  applyTo(money: Money): Money {
    return money.multiply(this.value);
  }

  // 计算剩余百分比（用于折扣场景）
  complement(): Percentage {
    return new Percentage(1 - this.value);
  }

  // 加法
  add(other: Percentage): Percentage {
    const result = this.value + other.value;
    if (result > 1) {
      throw new InvalidPercentageError('百分比之和不能超过100%');
    }
    return new Percentage(result);
  }

  // 相等性
  equals(other: Percentage | null | undefined): boolean {
    if (!other) return false;
    return Math.abs(this.value - other.value) < 0.0001;
  }

  toString(): string {
    return `${(this.value * 100).toFixed(2)}%`;
  }
}
```

### 日期范围类 (DateRange)

```typescript
class DateRange {
  private readonly startDate: Date;
  private readonly endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new InvalidDateRangeError('开始日期无效');
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new InvalidDateRangeError('结束日期无效');
    }
    if (startDate > endDate) {
      throw new InvalidDateRangeError('开始日期不能晚于结束日期');
    }

    this.startDate = new Date(startDate);
    this.endDate = new Date(endDate);
  }

  static createDay(date: Date): DateRange {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return new DateRange(start, end);
  }

  static createMonth(year: number, month: number): DateRange {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return new DateRange(start, end);
  }

  static createYear(year: number): DateRange {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return new DateRange(start, end);
  }

  getStartDate(): Date {
    return new Date(this.startDate);
  }

  getEndDate(): Date {
    return new Date(this.endDate);
  }

  // 判断日期是否在范围内
  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  // 判断是否与另一个范围重叠
  overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate && this.endDate >= other.startDate;
  }

  // 计算持续天数
  getDays(): number {
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 计算持续小时数
  getHours(): number {
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  // 扩展范围
  extend(days: number): DateRange {
    const newEnd = new Date(this.endDate);
    newEnd.setDate(newEnd.getDate() + days);
    return new DateRange(this.startDate, newEnd);
  }

  // 判断是否已过期
  isExpired(): boolean {
    return new Date() > this.endDate;
  }

  // 判断是否尚未开始
  isNotStarted(): boolean {
    return new Date() < this.startDate;
  }

  // 判断是否正在进行中
  isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  equals(other: DateRange | null | undefined): boolean {
    if (!other) return false;
    return this.startDate.getTime() === other.startDate.getTime() &&
           this.endDate.getTime() === other.endDate.getTime();
  }

  toString(): string {
    const format = (d: Date) => d.toISOString().split('T')[0];
    return `${format(this.startDate)} ~ ${format(this.endDate)}`;
  }
}
```

### 中国身份证号码

```typescript
class ChineseIdCard {
  private readonly value: string;
  private readonly birthDate: Date;
  private readonly gender: 'male' | 'female';
  private readonly regionCode: string;

  constructor(value: string) {
    const cleaned = value.toUpperCase().replace(/\s/g, '');

    if (!/^\d{17}[\dX]$/.test(cleaned)) {
      throw new InvalidIdCardError('身份证号码格式无效');
    }

    if (!this.validateChecksum(cleaned)) {
      throw new InvalidIdCardError('身份证号码校验位错误');
    }

    this.value = cleaned;
    this.regionCode = cleaned.slice(0, 6);
    this.birthDate = this.parseBirthDate(cleaned);
    this.gender = parseInt(cleaned.charAt(16)) % 2 === 1 ? 'male' : 'female';
  }

  private validateChecksum(id: string): boolean {
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checksumChars = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(id.charAt(i)) * weights[i];
    }

    return checksumChars[sum % 11] === id.charAt(17);
  }

  private parseBirthDate(id: string): Date {
    const year = parseInt(id.slice(6, 10));
    const month = parseInt(id.slice(10, 12)) - 1;
    const day = parseInt(id.slice(12, 14));

    const date = new Date(year, month, day);

    if (isNaN(date.getTime())) {
      throw new InvalidIdCardError('身份证中的出生日期无效');
    }

    if (date > new Date()) {
      throw new InvalidIdCardError('出生日期不能是未来日期');
    }

    return date;
  }

  getValue(): string {
    return this.value;
  }

  getBirthDate(): Date {
    return new Date(this.birthDate);
  }

  getGender(): 'male' | 'female' {
    return this.gender;
  }

  getRegionCode(): string {
    return this.regionCode;
  }

  // 计算年龄
  getAge(): number {
    const today = new Date();
    let age = today.getFullYear() - this.birthDate.getFullYear();
    const monthDiff = today.getMonth() - this.birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthDate.getDate())) {
      age--;
    }

    return age;
  }

  // 判断是否成年
  isAdult(): boolean {
    return this.getAge() >= 18;
  }

  // 脱敏显示
  getMasked(): string {
    return `${this.value.slice(0, 6)}********${this.value.slice(-4)}`;
  }

  // 获取生肖
  getChineseZodiac(): string {
    const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const year = this.birthDate.getFullYear();
    return zodiacs[(year - 4) % 12];
  }

  equals(other: ChineseIdCard | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  toString(): string {
    return this.getMasked();
  }
}
```

---

## 验证策略

### 构造时验证 (Fail Fast)

```typescript
class Username {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 20;
  private static readonly VALID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  private static readonly RESERVED_NAMES = ['admin', 'root', 'system', 'null', 'undefined'];

  private readonly value: string;

  constructor(value: string) {
    const trimmed = value?.trim().toLowerCase();

    // 空值检查
    if (!trimmed) {
      throw new InvalidUsernameError('用户名不能为空');
    }

    // 长度检查
    if (trimmed.length < Username.MIN_LENGTH) {
      throw new InvalidUsernameError(
        `用户名长度不能少于${Username.MIN_LENGTH}个字符`
      );
    }

    if (trimmed.length > Username.MAX_LENGTH) {
      throw new InvalidUsernameError(
        `用户名长度不能超过${Username.MAX_LENGTH}个字符`
      );
    }

    // 格式检查
    if (!Username.VALID_PATTERN.test(trimmed)) {
      throw new InvalidUsernameError(
        '用户名必须以字母开头，只能包含字母、数字和下划线'
      );
    }

    // 保留名称检查
    if (Username.RESERVED_NAMES.includes(trimmed)) {
      throw new InvalidUsernameError('该用户名为系统保留名称');
    }

    this.value = trimmed;
  }

  getValue(): string {
    return this.value;
  }
}
```

### 工厂方法验证

```typescript
class Password {
  private readonly hashedValue: string;

  private constructor(hashedValue: string) {
    this.hashedValue = hashedValue;
  }

  // 从明文密码创建（包含验证）
  static async fromPlainText(plainText: string): Promise<Password> {
    // 验证规则
    const errors: string[] = [];

    if (!plainText || plainText.length < 8) {
      errors.push('密码长度不能少于8个字符');
    }

    if (plainText.length > 128) {
      errors.push('密码长度不能超过128个字符');
    }

    if (!/[A-Z]/.test(plainText)) {
      errors.push('密码必须包含大写字母');
    }

    if (!/[a-z]/.test(plainText)) {
      errors.push('密码必须包含小写字母');
    }

    if (!/[0-9]/.test(plainText)) {
      errors.push('密码必须包含数字');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(plainText)) {
      errors.push('密码必须包含特殊字符');
    }

    // 检查常见弱密码
    const weakPasswords = ['password', '12345678', 'qwerty'];
    if (weakPasswords.some(weak => plainText.toLowerCase().includes(weak))) {
      errors.push('密码过于简单');
    }

    if (errors.length > 0) {
      throw new InvalidPasswordError(errors.join('; '));
    }

    // 使用 bcrypt 哈希
    const hashedValue = await bcrypt.hash(plainText, 12);
    return new Password(hashedValue);
  }

  // 从已哈希的密码恢复（用于从数据库加载）
  static fromHash(hashedValue: string): Password {
    if (!hashedValue) {
      throw new InvalidPasswordError('哈希密码不能为空');
    }
    return new Password(hashedValue);
  }

  // 验证密码
  async verify(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.hashedValue);
  }

  getHashedValue(): string {
    return this.hashedValue;
  }

  // 密码不应该被打印
  toString(): string {
    return '[PROTECTED]';
  }

  toJSON(): string {
    return '[PROTECTED]';
  }
}
```

### 可选值处理

```typescript
// 使用 Result 类型处理可能失败的创建
type Result<T, E> = { success: true; value: T } | { success: false; error: E };

class EmailAddress {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  // 抛出异常的版本
  static create(value: string): EmailAddress {
    const result = EmailAddress.tryCreate(value);
    if (!result.success) {
      throw new InvalidEmailError(result.error);
    }
    return result.value;
  }

  // 返回 Result 的版本（不抛出异常）
  static tryCreate(value: string): Result<EmailAddress, string> {
    const trimmed = value?.trim().toLowerCase();

    if (!trimmed) {
      return { success: false, error: '邮箱地址不能为空' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { success: false, error: '邮箱格式无效' };
    }

    if (trimmed.length > 254) {
      return { success: false, error: '邮箱地址过长' };
    }

    return { success: true, value: new EmailAddress(trimmed) };
  }

  getValue(): string {
    return this.value;
  }
}

// 使用示例
function processUserInput(emailInput: string): void {
  const result = EmailAddress.tryCreate(emailInput);

  if (result.success) {
    console.log('有效的邮箱:', result.value.getValue());
  } else {
    console.log('无效的邮箱:', result.error);
  }
}
```

---

## 实际应用示例

### 使用领域原语重构服务

```typescript
// 重构前：充满原始类型
class OrderServiceBefore {
  createOrder(
    customerId: string,
    items: Array<{ productId: string; quantity: number; price: number }>,
    shippingAddress: string,
    email: string,
    phone: string,
    couponCode: string | null
  ): string {
    // 验证散落在各处
    if (!customerId) throw new Error('客户ID不能为空');
    if (!email.includes('@')) throw new Error('邮箱格式无效');
    // ... 更多验证

    // 业务逻辑
    return 'order-id';
  }
}

// 重构后：使用领域原语
class OrderServiceAfter {
  createOrder(command: CreateOrderCommand): OrderId {
    // 所有验证都在领域原语的构造函数中完成
    // 这里只需要关注业务逻辑

    const order = Order.create({
      id: OrderId.generate(),
      customerId: command.customerId,
      items: command.items,
      shippingAddress: command.shippingAddress,
      contactInfo: command.contactInfo
    });

    if (command.couponCode) {
      order.applyCoupon(command.couponCode);
    }

    this.orderRepository.save(order);

    return order.getId();
  }
}

// 命令对象使用领域原语
class CreateOrderCommand {
  constructor(
    public readonly customerId: CustomerId,
    public readonly items: OrderItem[],
    public readonly shippingAddress: Address,
    public readonly contactInfo: ContactInfo,
    public readonly couponCode: CouponCode | null
  ) {}
}

// 联系信息值对象
class ContactInfo {
  constructor(
    public readonly email: EmailAddress,
    public readonly phone: PhoneNumber
  ) {}

  equals(other: ContactInfo | null | undefined): boolean {
    if (!other) return false;
    return this.email.equals(other.email) && this.phone.equals(other.phone);
  }
}
```

### 实体中使用领域原语

```typescript
class User {
  private readonly id: UserId;
  private username: Username;
  private email: EmailAddress;
  private phone: PhoneNumber;
  private password: Password;
  private status: UserStatus;
  private createdAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username;
    this.email = props.email;
    this.phone = props.phone;
    this.password = props.password;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  static async create(props: CreateUserProps): Promise<User> {
    return new User({
      id: UserId.generate(),
      username: new Username(props.username),
      email: new EmailAddress(props.email),
      phone: new PhoneNumber(props.phone),
      password: await Password.fromPlainText(props.password),
      status: UserStatus.PENDING_VERIFICATION,
      createdAt: new Date()
    });
  }

  getId(): UserId {
    return this.id;
  }

  getEmail(): EmailAddress {
    return this.email;
  }

  // 更改邮箱需要业务验证
  changeEmail(newEmail: EmailAddress): void {
    if (this.email.equals(newEmail)) {
      return; // 相同邮箱，无需更改
    }

    this.email = newEmail;
    this.status = UserStatus.PENDING_VERIFICATION;
    // 触发领域事件：EmailChangedEvent
  }

  // 验证密码
  async verifyPassword(plainText: string): Promise<boolean> {
    return this.password.verify(plainText);
  }

  // 更改密码
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const isValid = await this.password.verify(currentPassword);
    if (!isValid) {
      throw new InvalidPasswordError('当前密码不正确');
    }

    this.password = await Password.fromPlainText(newPassword);
    // 触发领域事件：PasswordChangedEvent
  }
}
```

### 仓储接口使用领域原语

```typescript
interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: EmailAddress): Promise<User | null>;
  findByUsername(username: Username): Promise<User | null>;
  findByPhone(phone: PhoneNumber): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
  exists(id: UserId): Promise<boolean>;
  existsByEmail(email: EmailAddress): Promise<boolean>;
  existsByUsername(username: Username): Promise<boolean>;
}

// 仓储实现
class PostgresUserRepository implements UserRepository {
  async findById(id: UserId): Promise<User | null> {
    const row = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id.getValue()] // 使用 getValue() 获取原始值
    );

    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: EmailAddress): Promise<User | null> {
    const row = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.getValue()]
    );

    return row ? this.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    const snapshot = user.toSnapshot();

    await this.db.query(`
      INSERT INTO users (id, username, email, phone, password_hash, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        username = $2,
        email = $3,
        phone = $4,
        password_hash = $5,
        status = $6
    `, [
      snapshot.id,
      snapshot.username,
      snapshot.email,
      snapshot.phone,
      snapshot.passwordHash,
      snapshot.status,
      snapshot.createdAt
    ]);
  }

  private toDomain(row: UserRow): User {
    return User.reconstitute({
      id: new UserId(row.id),
      username: new Username(row.username),
      email: new EmailAddress(row.email),
      phone: new PhoneNumber(row.phone),
      password: Password.fromHash(row.password_hash),
      status: row.status as UserStatus,
      createdAt: row.created_at
    });
  }
}
```

---

## 最佳实践

### 何时创建领域原语

创建领域原语的信号：

1. **同一验证逻辑出现多次**
2. **方法参数容易混淆**（多个相同类型的参数）
3. **业务概念需要特定的行为**
4. **数据有特定的格式或约束**
5. **需要在多处使用相同的转换逻辑**

```typescript
// 信号1：验证逻辑重复
// 信号2：多个 string 参数容易混淆
function sendNotification(
  userId: string,      // 容易与 email 混淆
  email: string,       // 需要验证格式
  phone: string,       // 需要验证格式
  message: string
) {
  // 每次调用都要验证
  if (!isValidEmail(email)) { ... }
  if (!isValidPhone(phone)) { ... }
}

// 使用领域原语后
function sendNotification(
  userId: UserId,
  email: EmailAddress,
  phone: PhoneNumber,
  message: NotificationMessage
) {
  // 类型系统保证参数正确
  // 领域原语保证值有效
}
```

### 避免过度设计

不是所有原始类型都需要封装：

```typescript
// 不需要封装的场景
class Order {
  // 简单的布尔标志不需要封装
  private isUrgent: boolean;

  // 简单的计数器不需要封装
  private viewCount: number;

  // 内部使用的临时变量不需要封装
  private tempCalculationResult: number;
}

// 需要封装的场景
class Order {
  // 有业务含义的金额
  private totalAmount: Money;

  // 有格式要求的ID
  private orderId: OrderId;

  // 需要验证的联系方式
  private customerEmail: EmailAddress;
}
```

### 领域原语的组织

```
src/
├── domain/
│   ├── primitives/           # 领域原语
│   │   ├── identifiers/      # 标识符类
│   │   │   ├── UserId.ts
│   │   │   ├── OrderId.ts
│   │   │   └── ProductId.ts
│   │   ├── contact/          # 联系信息类
│   │   │   ├── EmailAddress.ts
│   │   │   ├── PhoneNumber.ts
│   │   │   └── ContactInfo.ts
│   │   ├── money/            # 金融类
│   │   │   ├── Money.ts
│   │   │   ├── Currency.ts
│   │   │   └── Percentage.ts
│   │   ├── personal/         # 个人信息类
│   │   │   ├── ChineseIdCard.ts
│   │   │   ├── Username.ts
│   │   │   └── Password.ts
│   │   └── common/           # 通用类
│   │       ├── DateRange.ts
│   │       └── Quantity.ts
│   ├── entities/             # 实体
│   ├── value-objects/        # 复合值对象
│   └── aggregates/           # 聚合
```

### 序列化与反序列化

```typescript
class EmailAddress {
  private readonly value: string;

  constructor(value: string) {
    // ... 验证逻辑
    this.value = value.trim().toLowerCase();
  }

  getValue(): string {
    return this.value;
  }

  // JSON 序列化
  toJSON(): string {
    return this.value;
  }

  // 从 JSON 反序列化
  static fromJSON(json: string): EmailAddress {
    return new EmailAddress(json);
  }

  // 数据库序列化
  toPersistence(): string {
    return this.value;
  }

  // 从数据库反序列化
  static fromPersistence(value: string): EmailAddress {
    return new EmailAddress(value);
  }
}

// 配合 class-transformer 使用
import { Transform } from 'class-transformer';

class CreateUserDTO {
  @Transform(({ value }) => new EmailAddress(value), { toClassOnly: true })
  @Transform(({ value }) => value.getValue(), { toPlainOnly: true })
  email: EmailAddress;
}
```

---

## 常见错误与反模式

### 验证不完整

```typescript
// 错误：验证不完整
class EmailAddress {
  constructor(private readonly value: string) {
    if (!value.includes('@')) {
      throw new Error('无效的邮箱');
    }
    // 缺少其他验证：空值、长度、格式等
  }
}

// 正确：完整验证
class EmailAddress {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private readonly value: string) {
    const trimmed = value?.trim().toLowerCase();

    if (!trimmed) {
      throw new InvalidEmailError('邮箱不能为空');
    }

    if (trimmed.length > 254) {
      throw new InvalidEmailError('邮箱长度超出限制');
    }

    if (!EmailAddress.EMAIL_REGEX.test(trimmed)) {
      throw new InvalidEmailError('邮箱格式无效');
    }

    this.value = trimmed;
  }
}
```

### 可变性

```typescript
// 错误：可变的领域原语
class Money {
  private amount: number;
  private currency: string;

  setAmount(amount: number): void {
    this.amount = amount; // 违反不可变性
  }
}

// 正确：不可变
class Money {
  private readonly amount: number;
  private readonly currency: string;

  // 返回新实例而不是修改当前实例
  add(other: Money): Money {
    return new Money(this.amount + other.amount, this.currency);
  }
}
```

### 暴露内部状态

```typescript
// 错误：暴露内部数组
class Order {
  private items: OrderItem[];

  getItems(): OrderItem[] {
    return this.items; // 外部可以直接修改
  }
}

// 正确：返回防御性副本或不可变视图
class Order {
  private items: OrderItem[];

  getItems(): readonly OrderItem[] {
    return [...this.items]; // 返回副本
  }
}
```

### 缺少相等性实现

```typescript
// 错误：缺少 equals 方法
class UserId {
  constructor(private readonly value: string) {}
}

const id1 = new UserId('123');
const id2 = new UserId('123');
console.log(id1 === id2); // false（引用比较）

// 正确：实现 equals 方法
class UserId {
  constructor(private readonly value: string) {}

  equals(other: UserId | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}

const id1 = new UserId('123');
const id2 = new UserId('123');
console.log(id1.equals(id2)); // true
```

---

## 与其他技术的集成

### 与 TypeORM 集成

```typescript
import { ValueTransformer } from 'typeorm';

// 自定义转换器
const emailTransformer: ValueTransformer = {
  to: (value: EmailAddress) => value?.getValue(),
  from: (value: string) => value ? new EmailAddress(value) : null
};

const moneyTransformer: ValueTransformer = {
  to: (value: Money) => value ? { amount: value.getCents(), currency: value.getCurrency() } : null,
  from: (value: { amount: number; currency: string }) =>
    value ? Money.fromCents(value.amount, value.currency as Currency) : null
};

// 在实体中使用
@Entity('users')
class UserEntity {
  @PrimaryColumn('uuid')
  @Transform(({ value }) => new UserId(value))
  id: UserId;

  @Column({ transformer: emailTransformer })
  email: EmailAddress;

  @Column('jsonb', { transformer: moneyTransformer })
  balance: Money;
}
```

### 与 NestJS 集成

```typescript
import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

// 自定义参数装饰器
export const ParsedEmail = createParamDecorator(
  (data: string, ctx: ExecutionContext): EmailAddress => {
    const request = ctx.switchToHttp().getRequest();
    const value = data ? request.body[data] : request.body.email;

    try {
      return new EmailAddress(value);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
);

// 在控制器中使用
@Controller('users')
class UserController {
  @Post()
  createUser(@ParsedEmail('email') email: EmailAddress) {
    // email 已经是验证过的 EmailAddress 实例
  }
}

// 自定义验证管道
@Injectable()
export class ParseEmailPipe implements PipeTransform<string, EmailAddress> {
  transform(value: string): EmailAddress {
    try {
      return new EmailAddress(value);
    } catch (error) {
      throw new BadRequestException(`无效的邮箱地址: ${error.message}`);
    }
  }
}
```

### 与 GraphQL 集成

```typescript
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('EmailAddress', () => EmailAddress)
export class EmailAddressScalar implements CustomScalar<string, EmailAddress> {
  description = '邮箱地址标量类型';

  parseValue(value: string): EmailAddress {
    return new EmailAddress(value);
  }

  serialize(value: EmailAddress): string {
    return value.getValue();
  }

  parseLiteral(ast: ValueNode): EmailAddress {
    if (ast.kind === Kind.STRING) {
      return new EmailAddress(ast.value);
    }
    throw new Error('邮箱地址必须是字符串');
  }
}

// 在 Schema 中使用
@ObjectType()
class User {
  @Field(() => EmailAddressScalar)
  email: EmailAddress;
}
```

---

## 面试要点

### 核心概念题

**Q1: 什么是领域原语？它与值对象有什么区别？**

答：领域原语是值对象的一种特殊形式，它封装单一的、不可再分的业务概念。主要区别：
- 领域原语通常只封装一个核心属性（如 EmailAddress 封装邮箱字符串）
- 值对象可以封装多个属性组成的复合概念（如 Address 包含省市区街道）
- 领域原语更强调自我验证和类型安全

**Q2: 什么是原始类型偏执？如何解决？**

答：原始类型偏执是指过度使用 string、number 等原始类型来表示领域概念。问题包括：参数容易混淆、验证逻辑分散、缺乏业务语义。解决方案是使用领域原语封装这些概念，将验证逻辑和业务行为封装在类型本身中。

**Q3: 领域原语应该遵循哪些设计原则？**

答：
1. 自我验证：创建时验证有效性，不允许无效实例
2. 不可变性：创建后不可修改，修改操作返回新实例
3. 相等性：基于值而非引用判断相等
4. 富有表现力：提供有意义的业务方法

### 设计题

**Q4: 设计一个表示中国手机号码的领域原语**

```typescript
class ChinesePhoneNumber {
  private static readonly MOBILE_REGEX = /^1[3-9]\d{9}$/;
  private readonly value: string;

  constructor(value: string) {
    const cleaned = value.replace(/[\s\-]/g, '');

    if (!ChinesePhoneNumber.MOBILE_REGEX.test(cleaned)) {
      throw new InvalidPhoneNumberError('无效的中国手机号码');
    }

    this.value = cleaned;
  }

  getValue(): string {
    return this.value;
  }

  // 格式化显示
  getFormatted(): string {
    return `${this.value.slice(0, 3)}-${this.value.slice(3, 7)}-${this.value.slice(7)}`;
  }

  // 脱敏显示
  getMasked(): string {
    return `${this.value.slice(0, 3)}****${this.value.slice(7)}`;
  }

  // 获取运营商
  getCarrier(): string {
    // 简化实现
    const prefix = this.value.slice(0, 3);
    if (['134', '135', '136', '137', '138', '139', '150', '151', '152'].includes(prefix)) {
      return 'CHINA_MOBILE';
    }
    // ... 其他运营商判断
    return 'UNKNOWN';
  }

  equals(other: ChinesePhoneNumber | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
```

### 实践题

**Q5: 在一个电商系统中，哪些概念适合用领域原语表示？**

答：
- **标识符类**：OrderId, ProductId, UserId, SKU
- **联系方式类**：EmailAddress, PhoneNumber
- **金融类**：Money, Price, Discount, TaxRate
- **度量类**：Weight, Dimension, Quantity
- **个人信息类**：IdCard, BankCardNumber
- **业务编码类**：OrderNumber, TrackingNumber, CouponCode

**Q6: 使用领域原语有什么优缺点？**

优点：
1. 类型安全，编译时发现错误
2. 验证逻辑集中，易于维护
3. 代码更具表现力，提高可读性
4. 减少重复验证代码
5. 便于单元测试

缺点：
1. 增加代码量和类的数量
2. 需要处理序列化/反序列化
3. 与 ORM 等框架集成需要额外工作
4. 小型项目可能过度设计

---

## 总结

领域原语是领域驱动设计中提高代码质量的重要工具。通过将验证逻辑和业务行为封装在类型本身中，我们可以：

1. **消除原始类型偏执**：用有意义的类型替代裸露的原始类型
2. **实现 "使非法状态无法表示"**：在编译时和构造时捕获错误
3. **提高代码可读性**：类型名称表达业务意图
4. **减少重复**：验证逻辑集中在一处
5. **增强类型安全**：避免参数混淆

关键要点：
- 领域原语是不可变的、自我验证的单一概念封装
- 在构造函数中执行所有验证，实现 Fail Fast
- 提供富有表现力的业务方法，而不仅是简单的 getter
- 正确实现相等性比较
- 与框架集成时需要处理序列化问题
- 避免过度设计，不是所有原始类型都需要封装

掌握领域原语的设计和使用，是提升代码质量、减少 Bug 的有效手段，也是深入理解 DDD 的重要一步。
