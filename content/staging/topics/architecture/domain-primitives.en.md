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
origin: old/src/content/docs/architecture/domain-primitives.en.md
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

## Overview

Domain Primitives is an important concept in Domain-Driven Design (DDD). It represents a domain-specific encapsulation of primitive types. Domain primitives encapsulate business rules and validation logic within the type itself, ensuring that whenever this type is used anywhere in the system, its value is always valid.

The core idea of domain primitives is: **Make illegal states unrepresentable**.

---

## What Are Domain Primitives

### Definition

A domain primitive is a special type of value object that:

1. **Encapsulates a single concept**: Represents an indivisible business concept
2. **Self-validates**: Validates data validity upon creation
3. **Is immutable**: State cannot change after creation
4. **Is type-safe**: Provides strong type guarantees, preventing parameter confusion

### Domain Primitives vs Value Objects

Although domain primitives are a type of value object, they have subtle differences:

| Feature | Domain Primitive | Value Object |
|---------|------------------|--------------|
| Encapsulated concept | Single, atomic concept | Can be composite concept |
| Number of properties | Usually only one core property | Can have multiple properties |
| Complexity | Simple | Can be more complex |
| Examples | EmailAddress, PhoneNumber | Address, Money, DateRange |

```typescript
// Domain Primitive: Single concept
class EmailAddress {
  constructor(private readonly value: string) {
    this.validate(value);
  }
}

// Value Object: Composite concept
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

## Primitive Obsession Anti-Pattern

### What Is Primitive Obsession

Primitive Obsession is a common code smell that refers to the overuse of primitive types (string, number, boolean, etc.) to represent domain concepts, rather than creating appropriate domain types.

### Problems with Primitive Obsession

```typescript
// Code full of primitive obsession
class UserService {
  createUser(
    name: string,
    email: string,
    phone: string,
    age: number,
    zipCode: string
  ): User {
    // Problem 1: Parameter order easily confused
    // Problem 2: Any string can be passed as email
    // Problem 3: Validation logic scattered everywhere
    // Problem 4: No business semantics
    return new User(name, email, phone, age, zipCode);
  }
}

// Easy to make mistakes when calling
userService.createUser(
  "john@example.com",  // Error: email used as name
  "John Doe",          // Error: name used as email
  "12345",             // Is this phone or zipCode?
  25,
  "13800138000"        // Error: phone used as zipCode
);
```

### Issues Caused by Primitive Obsession

1. **Parameter confusion**: Parameters of the same type can easily be passed in wrong positions
2. **Scattered validation**: Data validation logic is spread throughout the system
3. **Duplicate validation**: Same validation logic is implemented multiple times
4. **Lack of semantics**: Code cannot express business intent
5. **Difficult refactoring**: Modifying validation rules requires changes in multiple places
6. **Testing difficulty**: Need to test validation logic at each point of use

---

## Design Principles for Domain Primitives

### Self-Validation

Domain primitives must validate their own validity upon creation, not allowing invalid instances to be created.

```typescript
class EmailAddress {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly value: string;

  constructor(value: string) {
    const trimmed = value?.trim().toLowerCase();

    if (!trimmed) {
      throw new InvalidEmailError('Email address cannot be empty');
    }

    if (!EmailAddress.EMAIL_REGEX.test(trimmed)) {
      throw new InvalidEmailError(`Invalid email address format: ${value}`);
    }

    if (trimmed.length > 254) {
      throw new InvalidEmailError('Email address length cannot exceed 254 characters');
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

### Immutability

Domain primitives cannot be modified after creation; any "modification" operation returns a new instance.

```typescript
class Quantity {
  private readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new InvalidQuantityError('Quantity must be an integer');
    }
    if (value < 0) {
      throw new InvalidQuantityError('Quantity cannot be negative');
    }
    if (value > 10000) {
      throw new InvalidQuantityError('Quantity cannot exceed 10000');
    }
    this.value = value;
  }

  getValue(): number {
    return this.value;
  }

  // Immutable operation: returns new instance
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

### Equality

Domain primitive equality is based on value comparison, not reference.

```typescript
class ProductId {
  private readonly value: string;

  constructor(value: string) {
    if (!value || value.trim() === '') {
      throw new InvalidProductIdError('Product ID cannot be empty');
    }
    if (!/^PRD-[A-Z0-9]{8}$/.test(value)) {
      throw new InvalidProductIdError('Invalid product ID format');
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

  // Factory method: generate new ID
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

### Expressive API

Domain primitives should provide meaningful business methods, not just simple getters.

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
    // Chinese mobile number
    if (/^(\+86|86)?1[3-9]\d{9}$/.test(value)) {
      const number = value.replace(/^(\+86|86)/, '');
      return { countryCode: '86', nationalNumber: number };
    }

    // International number format
    const match = value.match(/^\+(\d{1,3})(\d{6,14})$/);
    if (match) {
      return { countryCode: match[1], nationalNumber: match[2] };
    }

    throw new InvalidPhoneNumberError(`Invalid phone number: ${value}`);
  }

  // Business method: get full number
  getFullNumber(): string {
    return `+${this.countryCode}${this.nationalNumber}`;
  }

  // Business method: get display format
  getDisplayFormat(): string {
    if (this.countryCode === '86') {
      const n = this.nationalNumber;
      return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
    }
    return this.getFullNumber();
  }

  // Business method: check if Chinese number
  isChineseNumber(): boolean {
    return this.countryCode === '86';
  }

  // Business method: get carrier type (simplified example)
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

  // Business method: masked display
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

## Common Domain Primitive Implementations

### Identifiers

```typescript
// Generic ID base class
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

// Order ID
class OrderId extends Identifier<string> {
  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new InvalidOrderIdError('Order ID cannot be empty');
    }
    if (!/^ORD-\d{14}-[A-Z0-9]{4}$/.test(value)) {
      throw new InvalidOrderIdError(`Invalid order ID format: ${value}`);
    }
  }

  static generate(): OrderId {
    const timestamp = new Date().toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return new OrderId(`ORD-${timestamp}-${random}`);
  }

  // Extract time information from order ID
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

// User ID
class UserId extends Identifier<string> {
  constructor(value: string) {
    super(value);
  }

  protected validate(value: string): void {
    if (!value || value.trim() === '') {
      throw new InvalidUserIdError('User ID cannot be empty');
    }
    // UUID v4 format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw new InvalidUserIdError(`Invalid user ID format: ${value}`);
    }
  }

  static generate(): UserId {
    const uuid = crypto.randomUUID();
    return new UserId(uuid);
  }
}
```

### Money

```typescript
enum Currency {
  CNY = 'CNY',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY'
}

class Money {
  // Store as integers to avoid floating-point precision issues
  // For CNY/USD/EUR store cents, for JPY store yen
  private readonly cents: number;
  private readonly currency: Currency;

  private constructor(cents: number, currency: Currency) {
    this.cents = cents;
    this.currency = currency;
  }

  // Create from yuan/dollars
  static fromYuan(amount: number, currency: Currency = Currency.CNY): Money {
    if (!Number.isFinite(amount)) {
      throw new InvalidMoneyError('Amount must be a valid number');
    }

    const cents = Math.round(amount * 100);
    if (cents < 0) {
      throw new InvalidMoneyError('Amount cannot be negative');
    }

    return new Money(cents, currency);
  }

  // Create from cents
  static fromCents(cents: number, currency: Currency = Currency.CNY): Money {
    if (!Number.isInteger(cents)) {
      throw new InvalidMoneyError('Cents must be an integer');
    }
    if (cents < 0) {
      throw new InvalidMoneyError('Amount cannot be negative');
    }

    return new Money(cents, currency);
  }

  static zero(currency: Currency = Currency.CNY): Money {
    return new Money(0, currency);
  }

  // Get yuan/dollars
  getAmount(): number {
    return this.cents / 100;
  }

  // Get cents
  getCents(): number {
    return this.cents;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  // Addition
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  // Subtraction
  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.cents - other.cents;
    if (result < 0) {
      throw new InvalidMoneyError('Insufficient balance');
    }
    return new Money(result, this.currency);
  }

  // Multiplication (for calculating taxes, discounts, etc.)
  multiply(factor: number): Money {
    const result = Math.round(this.cents * factor);
    return new Money(result, this.currency);
  }

  // Proportional allocation (for order splitting scenarios)
  allocate(ratios: number[]): Money[] {
    const total = ratios.reduce((sum, r) => sum + r, 0);
    let remainder = this.cents;
    const results: Money[] = [];

    for (let i = 0; i < ratios.length; i++) {
      const share = Math.floor(this.cents * ratios[i] / total);
      results.push(new Money(share, this.currency));
      remainder -= share;
    }

    // Allocate remainder to the first
    if (remainder > 0) {
      results[0] = new Money(results[0].cents + remainder, this.currency);
    }

    return results;
  }

  // Comparison
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

  // Format for display
  format(locale: string = 'zh-CN'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency
    }).format(this.getAmount());
  }

  // Equality
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
        `Currency mismatch: ${this.currency} and ${other.currency}`
      );
    }
  }
}
```

### Percentage

```typescript
class Percentage {
  private readonly value: number; // Stored as decimal, e.g., 0.15 represents 15%

  private constructor(value: number) {
    this.value = value;
  }

  // Create from percentage value (input 15 means 15%)
  static fromPercent(percent: number): Percentage {
    if (!Number.isFinite(percent)) {
      throw new InvalidPercentageError('Percentage must be a valid number');
    }
    if (percent < 0 || percent > 100) {
      throw new InvalidPercentageError('Percentage must be between 0 and 100');
    }
    return new Percentage(percent / 100);
  }

  // Create from decimal (input 0.15 means 15%)
  static fromDecimal(decimal: number): Percentage {
    if (!Number.isFinite(decimal)) {
      throw new InvalidPercentageError('Percentage must be a valid number');
    }
    if (decimal < 0 || decimal > 1) {
      throw new InvalidPercentageError('Decimal form of percentage must be between 0 and 1');
    }
    return new Percentage(decimal);
  }

  static zero(): Percentage {
    return new Percentage(0);
  }

  static full(): Percentage {
    return new Percentage(1);
  }

  // Get decimal value
  toDecimal(): number {
    return this.value;
  }

  // Get percentage value
  toPercent(): number {
    return this.value * 100;
  }

  // Apply to money
  applyTo(money: Money): Money {
    return money.multiply(this.value);
  }

  // Calculate remaining percentage (for discount scenarios)
  complement(): Percentage {
    return new Percentage(1 - this.value);
  }

  // Addition
  add(other: Percentage): Percentage {
    const result = this.value + other.value;
    if (result > 1) {
      throw new InvalidPercentageError('Sum of percentages cannot exceed 100%');
    }
    return new Percentage(result);
  }

  // Equality
  equals(other: Percentage | null | undefined): boolean {
    if (!other) return false;
    return Math.abs(this.value - other.value) < 0.0001;
  }

  toString(): string {
    return `${(this.value * 100).toFixed(2)}%`;
  }
}
```

### DateRange

```typescript
class DateRange {
  private readonly startDate: Date;
  private readonly endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new InvalidDateRangeError('Invalid start date');
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new InvalidDateRangeError('Invalid end date');
    }
    if (startDate > endDate) {
      throw new InvalidDateRangeError('Start date cannot be later than end date');
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

  // Check if date is within range
  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  // Check if overlaps with another range
  overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate && this.endDate >= other.startDate;
  }

  // Calculate duration in days
  getDays(): number {
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculate duration in hours
  getHours(): number {
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  // Extend range
  extend(days: number): DateRange {
    const newEnd = new Date(this.endDate);
    newEnd.setDate(newEnd.getDate() + days);
    return new DateRange(this.startDate, newEnd);
  }

  // Check if expired
  isExpired(): boolean {
    return new Date() > this.endDate;
  }

  // Check if not yet started
  isNotStarted(): boolean {
    return new Date() < this.startDate;
  }

  // Check if currently active
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

### Chinese ID Card Number

```typescript
class ChineseIdCard {
  private readonly value: string;
  private readonly birthDate: Date;
  private readonly gender: 'male' | 'female';
  private readonly regionCode: string;

  constructor(value: string) {
    const cleaned = value.toUpperCase().replace(/\s/g, '');

    if (!/^\d{17}[\dX]$/.test(cleaned)) {
      throw new InvalidIdCardError('Invalid ID card number format');
    }

    if (!this.validateChecksum(cleaned)) {
      throw new InvalidIdCardError('ID card number checksum error');
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
      throw new InvalidIdCardError('Invalid birth date in ID card');
    }

    if (date > new Date()) {
      throw new InvalidIdCardError('Birth date cannot be in the future');
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

  // Calculate age
  getAge(): number {
    const today = new Date();
    let age = today.getFullYear() - this.birthDate.getFullYear();
    const monthDiff = today.getMonth() - this.birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthDate.getDate())) {
      age--;
    }

    return age;
  }

  // Check if adult
  isAdult(): boolean {
    return this.getAge() >= 18;
  }

  // Masked display
  getMasked(): string {
    return `${this.value.slice(0, 6)}********${this.value.slice(-4)}`;
  }

  // Get Chinese zodiac
  getChineseZodiac(): string {
    const zodiacs = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
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

## Validation Strategies

### Constructor Validation (Fail Fast)

```typescript
class Username {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 20;
  private static readonly VALID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  private static readonly RESERVED_NAMES = ['admin', 'root', 'system', 'null', 'undefined'];

  private readonly value: string;

  constructor(value: string) {
    const trimmed = value?.trim().toLowerCase();

    // Null check
    if (!trimmed) {
      throw new InvalidUsernameError('Username cannot be empty');
    }

    // Length check
    if (trimmed.length < Username.MIN_LENGTH) {
      throw new InvalidUsernameError(
        `Username length cannot be less than ${Username.MIN_LENGTH} characters`
      );
    }

    if (trimmed.length > Username.MAX_LENGTH) {
      throw new InvalidUsernameError(
        `Username length cannot exceed ${Username.MAX_LENGTH} characters`
      );
    }

    // Format check
    if (!Username.VALID_PATTERN.test(trimmed)) {
      throw new InvalidUsernameError(
        'Username must start with a letter and can only contain letters, numbers, and underscores'
      );
    }

    // Reserved names check
    if (Username.RESERVED_NAMES.includes(trimmed)) {
      throw new InvalidUsernameError('This username is reserved by the system');
    }

    this.value = trimmed;
  }

  getValue(): string {
    return this.value;
  }
}
```

### Factory Method Validation

```typescript
class Password {
  private readonly hashedValue: string;

  private constructor(hashedValue: string) {
    this.hashedValue = hashedValue;
  }

  // Create from plain text password (includes validation)
  static async fromPlainText(plainText: string): Promise<Password> {
    // Validation rules
    const errors: string[] = [];

    if (!plainText || plainText.length < 8) {
      errors.push('Password length cannot be less than 8 characters');
    }

    if (plainText.length > 128) {
      errors.push('Password length cannot exceed 128 characters');
    }

    if (!/[A-Z]/.test(plainText)) {
      errors.push('Password must contain uppercase letters');
    }

    if (!/[a-z]/.test(plainText)) {
      errors.push('Password must contain lowercase letters');
    }

    if (!/[0-9]/.test(plainText)) {
      errors.push('Password must contain numbers');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(plainText)) {
      errors.push('Password must contain special characters');
    }

    // Check common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty'];
    if (weakPasswords.some(weak => plainText.toLowerCase().includes(weak))) {
      errors.push('Password is too simple');
    }

    if (errors.length > 0) {
      throw new InvalidPasswordError(errors.join('; '));
    }

    // Hash using bcrypt
    const hashedValue = await bcrypt.hash(plainText, 12);
    return new Password(hashedValue);
  }

  // Restore from hashed password (for loading from database)
  static fromHash(hashedValue: string): Password {
    if (!hashedValue) {
      throw new InvalidPasswordError('Hashed password cannot be empty');
    }
    return new Password(hashedValue);
  }

  // Verify password
  async verify(plainText: string): Promise<boolean> {
    return bcrypt.compare(plainText, this.hashedValue);
  }

  getHashedValue(): string {
    return this.hashedValue;
  }

  // Password should not be printed
  toString(): string {
    return '[PROTECTED]';
  }

  toJSON(): string {
    return '[PROTECTED]';
  }
}
```

### Optional Value Handling

```typescript
// Using Result type to handle potentially failing creation
type Result<T, E> = { success: true; value: T } | { success: false; error: E };

class EmailAddress {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  // Version that throws exception
  static create(value: string): EmailAddress {
    const result = EmailAddress.tryCreate(value);
    if (!result.success) {
      throw new InvalidEmailError(result.error);
    }
    return result.value;
  }

  // Version that returns Result (doesn't throw exception)
  static tryCreate(value: string): Result<EmailAddress, string> {
    const trimmed = value?.trim().toLowerCase();

    if (!trimmed) {
      return { success: false, error: 'Email address cannot be empty' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { success: false, error: 'Invalid email format' };
    }

    if (trimmed.length > 254) {
      return { success: false, error: 'Email address is too long' };
    }

    return { success: true, value: new EmailAddress(trimmed) };
  }

  getValue(): string {
    return this.value;
  }
}

// Usage example
function processUserInput(emailInput: string): void {
  const result = EmailAddress.tryCreate(emailInput);

  if (result.success) {
    console.log('Valid email:', result.value.getValue());
  } else {
    console.log('Invalid email:', result.error);
  }
}
```

---

## Practical Application Examples

### Refactoring Services with Domain Primitives

```typescript
// Before refactoring: Full of primitive types
class OrderServiceBefore {
  createOrder(
    customerId: string,
    items: Array<{ productId: string; quantity: number; price: number }>,
    shippingAddress: string,
    email: string,
    phone: string,
    couponCode: string | null
  ): string {
    // Validation scattered everywhere
    if (!customerId) throw new Error('Customer ID cannot be empty');
    if (!email.includes('@')) throw new Error('Invalid email format');
    // ... more validation

    // Business logic
    return 'order-id';
  }
}

// After refactoring: Using domain primitives
class OrderServiceAfter {
  createOrder(command: CreateOrderCommand): OrderId {
    // All validation is done in domain primitive constructors
    // Here we only focus on business logic

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

// Command object uses domain primitives
class CreateOrderCommand {
  constructor(
    public readonly customerId: CustomerId,
    public readonly items: OrderItem[],
    public readonly shippingAddress: Address,
    public readonly contactInfo: ContactInfo,
    public readonly couponCode: CouponCode | null
  ) {}
}

// Contact info value object
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

### Using Domain Primitives in Entities

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

  // Changing email requires business validation
  changeEmail(newEmail: EmailAddress): void {
    if (this.email.equals(newEmail)) {
      return; // Same email, no change needed
    }

    this.email = newEmail;
    this.status = UserStatus.PENDING_VERIFICATION;
    // Trigger domain event: EmailChangedEvent
  }

  // Verify password
  async verifyPassword(plainText: string): Promise<boolean> {
    return this.password.verify(plainText);
  }

  // Change password
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const isValid = await this.password.verify(currentPassword);
    if (!isValid) {
      throw new InvalidPasswordError('Current password is incorrect');
    }

    this.password = await Password.fromPlainText(newPassword);
    // Trigger domain event: PasswordChangedEvent
  }
}
```

### Repository Interfaces Using Domain Primitives

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

// Repository implementation
class PostgresUserRepository implements UserRepository {
  async findById(id: UserId): Promise<User | null> {
    const row = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id.getValue()] // Use getValue() to get raw value
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

## Best Practices

### When to Create Domain Primitives

Signals to create domain primitives:

1. **Same validation logic appears multiple times**
2. **Method parameters are easily confused** (multiple parameters of the same type)
3. **Business concepts require specific behaviors**
4. **Data has specific format or constraints**
5. **Same transformation logic needs to be used in multiple places**

```typescript
// Signal 1: Validation logic repetition
// Signal 2: Multiple string parameters easily confused
function sendNotification(
  userId: string,      // Easily confused with email
  email: string,       // Needs format validation
  phone: string,       // Needs format validation
  message: string
) {
  // Must validate on every call
  if (!isValidEmail(email)) { ... }
  if (!isValidPhone(phone)) { ... }
}

// After using domain primitives
function sendNotification(
  userId: UserId,
  email: EmailAddress,
  phone: PhoneNumber,
  message: NotificationMessage
) {
  // Type system ensures correct parameters
  // Domain primitives ensure valid values
}
```

### Avoid Over-Engineering

Not all primitive types need to be encapsulated:

```typescript
// Scenarios that don't need encapsulation
class Order {
  // Simple boolean flags don't need encapsulation
  private isUrgent: boolean;

  // Simple counters don't need encapsulation
  private viewCount: number;

  // Internal temporary variables don't need encapsulation
  private tempCalculationResult: number;
}

// Scenarios that need encapsulation
class Order {
  // Amounts with business meaning
  private totalAmount: Money;

  // IDs with format requirements
  private orderId: OrderId;

  // Contact info that needs validation
  private customerEmail: EmailAddress;
}
```

### Organizing Domain Primitives

```
src/
├── domain/
│   ├── primitives/           # Domain primitives
│   │   ├── identifiers/      # Identifier classes
│   │   │   ├── UserId.ts
│   │   │   ├── OrderId.ts
│   │   │   └── ProductId.ts
│   │   ├── contact/          # Contact info classes
│   │   │   ├── EmailAddress.ts
│   │   │   ├── PhoneNumber.ts
│   │   │   └── ContactInfo.ts
│   │   ├── money/            # Financial classes
│   │   │   ├── Money.ts
│   │   │   ├── Currency.ts
│   │   │   └── Percentage.ts
│   │   ├── personal/         # Personal info classes
│   │   │   ├── ChineseIdCard.ts
│   │   │   ├── Username.ts
│   │   │   └── Password.ts
│   │   └── common/           # Common classes
│   │       ├── DateRange.ts
│   │       └── Quantity.ts
│   ├── entities/             # Entities
│   ├── value-objects/        # Composite value objects
│   └── aggregates/           # Aggregates
```

### Serialization and Deserialization

```typescript
class EmailAddress {
  private readonly value: string;

  constructor(value: string) {
    // ... validation logic
    this.value = value.trim().toLowerCase();
  }

  getValue(): string {
    return this.value;
  }

  // JSON serialization
  toJSON(): string {
    return this.value;
  }

  // Deserialize from JSON
  static fromJSON(json: string): EmailAddress {
    return new EmailAddress(json);
  }

  // Database serialization
  toPersistence(): string {
    return this.value;
  }

  // Deserialize from database
  static fromPersistence(value: string): EmailAddress {
    return new EmailAddress(value);
  }
}

// Using with class-transformer
import { Transform } from 'class-transformer';

class CreateUserDTO {
  @Transform(({ value }) => new EmailAddress(value), { toClassOnly: true })
  @Transform(({ value }) => value.getValue(), { toPlainOnly: true })
  email: EmailAddress;
}
```

---

## Common Mistakes and Anti-Patterns

### Incomplete Validation

```typescript
// Wrong: Incomplete validation
class EmailAddress {
  constructor(private readonly value: string) {
    if (!value.includes('@')) {
      throw new Error('Invalid email');
    }
    // Missing other validations: null check, length, format, etc.
  }
}

// Correct: Complete validation
class EmailAddress {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private readonly value: string) {
    const trimmed = value?.trim().toLowerCase();

    if (!trimmed) {
      throw new InvalidEmailError('Email cannot be empty');
    }

    if (trimmed.length > 254) {
      throw new InvalidEmailError('Email length exceeds limit');
    }

    if (!EmailAddress.EMAIL_REGEX.test(trimmed)) {
      throw new InvalidEmailError('Invalid email format');
    }

    this.value = trimmed;
  }
}
```

### Mutability

```typescript
// Wrong: Mutable domain primitive
class Money {
  private amount: number;
  private currency: string;

  setAmount(amount: number): void {
    this.amount = amount; // Violates immutability
  }
}

// Correct: Immutable
class Money {
  private readonly amount: number;
  private readonly currency: string;

  // Return new instance instead of modifying current one
  add(other: Money): Money {
    return new Money(this.amount + other.amount, this.currency);
  }
}
```

### Exposing Internal State

```typescript
// Wrong: Exposing internal array
class Order {
  private items: OrderItem[];

  getItems(): OrderItem[] {
    return this.items; // External code can modify directly
  }
}

// Correct: Return defensive copy or immutable view
class Order {
  private items: OrderItem[];

  getItems(): readonly OrderItem[] {
    return [...this.items]; // Return copy
  }
}
```

### Missing Equality Implementation

```typescript
// Wrong: Missing equals method
class UserId {
  constructor(private readonly value: string) {}
}

const id1 = new UserId('123');
const id2 = new UserId('123');
console.log(id1 === id2); // false (reference comparison)

// Correct: Implement equals method
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

## Integration with Other Technologies

### Integration with TypeORM

```typescript
import { ValueTransformer } from 'typeorm';

// Custom transformers
const emailTransformer: ValueTransformer = {
  to: (value: EmailAddress) => value?.getValue(),
  from: (value: string) => value ? new EmailAddress(value) : null
};

const moneyTransformer: ValueTransformer = {
  to: (value: Money) => value ? { amount: value.getCents(), currency: value.getCurrency() } : null,
  from: (value: { amount: number; currency: string }) =>
    value ? Money.fromCents(value.amount, value.currency as Currency) : null
};

// Use in entity
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

### Integration with NestJS

```typescript
import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

// Custom parameter decorator
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

// Use in controller
@Controller('users')
class UserController {
  @Post()
  createUser(@ParsedEmail('email') email: EmailAddress) {
    // email is already a validated EmailAddress instance
  }
}

// Custom validation pipe
@Injectable()
export class ParseEmailPipe implements PipeTransform<string, EmailAddress> {
  transform(value: string): EmailAddress {
    try {
      return new EmailAddress(value);
    } catch (error) {
      throw new BadRequestException(`Invalid email address: ${error.message}`);
    }
  }
}
```

### Integration with GraphQL

```typescript
import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('EmailAddress', () => EmailAddress)
export class EmailAddressScalar implements CustomScalar<string, EmailAddress> {
  description = 'Email address scalar type';

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
    throw new Error('Email address must be a string');
  }
}

// Use in Schema
@ObjectType()
class User {
  @Field(() => EmailAddressScalar)
  email: EmailAddress;
}
```

---

## Interview Key Points

### Core Concept Questions

**Q1: What are domain primitives? What's the difference between them and value objects?**

Answer: Domain primitives are a special form of value objects that encapsulate single, indivisible business concepts. Main differences:
- Domain primitives typically encapsulate only one core property (e.g., EmailAddress encapsulates an email string)
- Value objects can encapsulate composite concepts made up of multiple properties (e.g., Address contains province, city, district, street)
- Domain primitives place more emphasis on self-validation and type safety

**Q2: What is primitive obsession? How do you solve it?**

Answer: Primitive obsession refers to the overuse of primitive types like string and number to represent domain concepts. Problems include: parameters easily confused, scattered validation logic, lack of business semantics. The solution is to use domain primitives to encapsulate these concepts, encapsulating validation logic and business behavior within the type itself.

**Q3: What design principles should domain primitives follow?**

Answer:
1. Self-validation: Validate validity at creation, don't allow invalid instances
2. Immutability: Cannot be modified after creation, modification operations return new instances
3. Equality: Based on value, not reference comparison
4. Expressive: Provide meaningful business methods

### Design Questions

**Q4: Design a domain primitive representing a Chinese mobile phone number**

```typescript
class ChinesePhoneNumber {
  private static readonly MOBILE_REGEX = /^1[3-9]\d{9}$/;
  private readonly value: string;

  constructor(value: string) {
    const cleaned = value.replace(/[\s\-]/g, '');

    if (!ChinesePhoneNumber.MOBILE_REGEX.test(cleaned)) {
      throw new InvalidPhoneNumberError('Invalid Chinese mobile number');
    }

    this.value = cleaned;
  }

  getValue(): string {
    return this.value;
  }

  // Formatted display
  getFormatted(): string {
    return `${this.value.slice(0, 3)}-${this.value.slice(3, 7)}-${this.value.slice(7)}`;
  }

  // Masked display
  getMasked(): string {
    return `${this.value.slice(0, 3)}****${this.value.slice(7)}`;
  }

  // Get carrier
  getCarrier(): string {
    // Simplified implementation
    const prefix = this.value.slice(0, 3);
    if (['134', '135', '136', '137', '138', '139', '150', '151', '152'].includes(prefix)) {
      return 'CHINA_MOBILE';
    }
    // ... other carrier checks
    return 'UNKNOWN';
  }

  equals(other: ChinesePhoneNumber | null | undefined): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
```

### Practical Questions

**Q5: In an e-commerce system, which concepts are suitable for domain primitives?**

Answer:
- **Identifiers**: OrderId, ProductId, UserId, SKU
- **Contact Info**: EmailAddress, PhoneNumber
- **Financial**: Money, Price, Discount, TaxRate
- **Measurements**: Weight, Dimension, Quantity
- **Personal Info**: IdCard, BankCardNumber
- **Business Codes**: OrderNumber, TrackingNumber, CouponCode

**Q6: What are the pros and cons of using domain primitives?**

Pros:
1. Type safety, errors discovered at compile time
2. Validation logic centralized, easy to maintain
3. Code more expressive, improved readability
4. Reduced duplicate validation code
5. Easy to unit test

Cons:
1. Increases code volume and number of classes
2. Need to handle serialization/deserialization
3. Integration with ORM and other frameworks requires extra work
4. May be over-engineering for small projects

---

## Summary

Domain primitives are an important tool in Domain-Driven Design for improving code quality. By encapsulating validation logic and business behavior within the type itself, we can:

1. **Eliminate primitive obsession**: Replace naked primitive types with meaningful types
2. **Achieve "make illegal states unrepresentable"**: Catch errors at compile time and construction time
3. **Improve code readability**: Type names express business intent
4. **Reduce duplication**: Validation logic centralized in one place
5. **Enhance type safety**: Avoid parameter confusion

Key takeaways:
- Domain primitives are immutable, self-validating encapsulations of single concepts
- Execute all validation in the constructor, implementing Fail Fast
- Provide expressive business methods, not just simple getters
- Implement equality comparison correctly
- Handle serialization issues when integrating with frameworks
- Avoid over-engineering, not all primitive types need encapsulation

Mastering the design and use of domain primitives is an effective way to improve code quality and reduce bugs, and is an important step in fully understanding DDD.
