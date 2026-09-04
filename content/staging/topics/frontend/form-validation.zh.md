---
title: Form Validation Best Practices
description: Learn frontend form validation methods and libraries
track: frontend
section: html-css
difficulty: intermediate
tags:
  - forms
  - validation
  - Zod
  - React Hook Form
status: imported
origin: old/src/content/docs/frontend/form-validation.zh.md
divergence: 0.241
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Frontend
  subcategory: Forms
  order: 47
  lastUpdated: 2026-01-07
---

表单验证是 Web 开发的关键环节,它确保数据完整性、提升用户体验,并防止恶意输入到达服务器。本指南全面介绍了从基础客户端验证到使用 Zod 和 React Hook Form 等现代库进行高级模式验证的所有内容。

## 为什么表单验证很重要

### 验证的重要性

表单验证在现代 Web 应用中有多种用途:

1. **数据完整性**: 确保只有格式正确的数据才能提交
2. **用户体验**: 提供即时反馈,帮助用户纠正错误
3. **安全性**: 作为防止恶意输入的第一道防线
4. **减少服务器负载**: 防止无效数据产生不必要的服务器请求
5. **无障碍性**: 帮助残障用户理解表单要求

### 客户端验证与服务器端验证

```
+-------------------+     +-------------------+
|  客户端验证        |     |  服务器端验证       |
+-------------------+     +-------------------+
| - 即时反馈         |     | - 安全层           |
| - 更好的用户体验    |     | - 数据完整性        |
| - 减少负载         |     | - 业务规则          |
| - 可被绕过         |     | - 始终必需          |
+-------------------+     +-------------------+
        |                         |
        v                         v
   第一道防线                   最终权威
```

**重要提示**: 切勿仅依赖客户端验证。始终在服务器端也进行验证,因为客户端验证可以被绕过。

## 原生 HTML5 验证

### 内置验证属性

HTML5 提供了多种无需 JavaScript 即可使用的验证属性:

```html
<form id="registration-form">
  <!-- 必填字段 -->
  <input type="text" name="username" required />

  <!-- 邮箱验证 -->
  <input type="email" name="email" required />

  <!-- 最小和最大长度 -->
  <input type="text" name="nickname" minlength="3" maxlength="20" />

  <!-- 数字范围 -->
  <input type="number" name="age" min="18" max="120" />

  <!-- 使用正则表达式进行模式匹配 -->
  <input
    type="text"
    name="phone"
    pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
    title="格式: 123-456-7890"
  />

  <!-- URL 验证 -->
  <input type="url" name="website" />

  <button type="submit">提交</button>
</form>
```

### 自定义验证消息

```javascript
const form = document.getElementById('registration-form');
const emailInput = form.querySelector('input[name="email"]');

emailInput.addEventListener('invalid', (e) => {
  e.target.setCustomValidity('请输入有效的邮箱地址');
});

emailInput.addEventListener('input', (e) => {
  e.target.setCustomValidity(''); // 输入时清除自定义消息
});
```

### 验证状态样式

```css
/* 有效输入 */
input:valid {
  border-color: #22c55e;
}

/* 无效输入 */
input:invalid {
  border-color: #ef4444;
}

/* 仅在用户交互后显示无效状态 */
input:not(:placeholder-shown):invalid {
  border-color: #ef4444;
  background-color: #fef2f2;
}

/* 焦点状态 */
input:focus:invalid {
  outline-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}
```

### HTML5 验证的局限性

虽然有用,但 HTML5 验证存在以下局限性:

- 错误消息的自定义能力有限
- 不同浏览器的样式不一致
- 不支持复杂的验证规则
- 无法验证相互依赖的字段
- 不支持异步验证

## JavaScript 验证基础

### 基本验证模式

```javascript
class FormValidator {
  constructor(form) {
    this.form = form;
    this.errors = {};
  }

  validate() {
    this.errors = {};
    const formData = new FormData(this.form);

    // 验证每个字段
    this.validateRequired('username', formData.get('username'));
    this.validateEmail('email', formData.get('email'));
    this.validatePassword('password', formData.get('password'));
    this.validatePasswordConfirm(
      formData.get('password'),
      formData.get('confirmPassword')
    );

    return Object.keys(this.errors).length === 0;
  }

  validateRequired(field, value) {
    if (!value || value.trim() === '') {
      this.errors[field] = '此字段为必填项';
    }
  }

  validateEmail(field, value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      this.errors[field] = '请输入有效的邮箱地址';
    }
  }

  validatePassword(field, value) {
    if (value && value.length < 8) {
      this.errors[field] = '密码必须至少8个字符';
    }

    if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      this.errors[field] =
        '密码必须包含大写字母、小写字母和数字';
    }
  }

  validatePasswordConfirm(password, confirmPassword) {
    if (password !== confirmPassword) {
      this.errors['confirmPassword'] = '密码不匹配';
    }
  }

  getErrors() {
    return this.errors;
  }
}

// 使用方法
const form = document.getElementById('signup-form');
const validator = new FormValidator(form);

form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (validator.validate()) {
    // 提交表单
    form.submit();
  } else {
    // 显示错误
    displayErrors(validator.getErrors());
  }
});
```

### 可复用的验证函数

```javascript
// validation-rules.js
export const validationRules = {
  required: (value, message = '此字段为必填项') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },

  email: (value, message = '无效的邮箱地址') => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },

  minLength: (min) => (value, message) => {
    if (value && value.length < min) {
      return message || `至少需要 ${min} 个字符`;
    }
    return null;
  },

  maxLength: (max) => (value, message) => {
    if (value && value.length > max) {
      return message || `最多 ${max} 个字符`;
    }
    return null;
  },

  pattern: (regex, defaultMessage) => (value, message) => {
    if (value && !regex.test(value)) {
      return message || defaultMessage || '格式无效';
    }
    return null;
  },

  matches: (fieldToMatch, fieldName) => (value, _, formData) => {
    if (value !== formData[fieldToMatch]) {
      return `必须与${fieldName}匹配`;
    }
    return null;
  },

  // 可组合的验证器
  compose: (...validators) => (value, message, formData) => {
    for (const validator of validators) {
      const error = validator(value, message, formData);
      if (error) return error;
    }
    return null;
  }
};

// 使用示例
const { required, email, minLength, compose } = validationRules;

const userValidation = {
  email: compose(required, email),
  password: compose(required, minLength(8)),
  username: compose(required, minLength(3))
};
```

## 使用 Zod 进行模式验证

### Zod 简介

Zod 是一个 TypeScript 优先的模式验证库,提供类型推断功能,非常适合现代 TypeScript 应用。

```bash
npm install zod
```

### 基本 Zod 模式

```typescript
import { z } from 'zod';

// 简单模式
const userSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().min(18).max(120).optional(),
  website: z.string().url().optional()
});

// 类型推断
type User = z.infer<typeof userSchema>;
// { username: string; email: string; age?: number; website?: string }

// 验证
const result = userSchema.safeParse({
  username: 'johndoe',
  email: 'john@example.com',
  age: 25
});

if (result.success) {
  console.log(result.data); // 类型为 User
} else {
  console.log(result.error.issues);
}
```

### 高级 Zod 模式

```typescript
import { z } from 'zod';

// 自定义错误消息
const loginSchema = z.object({
  email: z
    .string({ required_error: '邮箱为必填项' })
    .email({ message: '请输入有效的邮箱地址' }),
  password: z
    .string({ required_error: '密码为必填项' })
    .min(8, { message: '密码必须至少8个字符' })
});

// 带自定义规则的密码验证
const passwordSchema = z
  .string()
  .min(8, '密码必须至少8个字符')
  .regex(/[a-z]/, '密码必须包含小写字母')
  .regex(/[A-Z]/, '密码必须包含大写字母')
  .regex(/[0-9]/, '密码必须包含数字')
  .regex(/[^a-zA-Z0-9]/, '密码必须包含特殊字符');

// 带密码确认的注册表单
const registrationSchema = z
  .object({
    username: z
      .string()
      .min(3, '用户名必须至少3个字符')
      .max(20, '用户名最多20个字符')
      .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
    email: z.string().email('无效的邮箱地址'),
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '密码不匹配',
    path: ['confirmPassword']
  });

// 条件验证
const paymentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('credit_card'),
    cardNumber: z.string().regex(/^\d{16}$/, '无效的卡号'),
    expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, '格式: MM/YY'),
    cvv: z.string().regex(/^\d{3,4}$/, '无效的CVV')
  }),
  z.object({
    method: z.literal('paypal'),
    paypalEmail: z.string().email('无效的PayPal邮箱')
  }),
  z.object({
    method: z.literal('bank_transfer'),
    accountNumber: z.string().min(10, '无效的账户号码'),
    routingNumber: z.string().length(9, '路由号码必须是9位数字')
  })
]);

// 转换和预处理
const formSchema = z.object({
  age: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().min(0).max(150).optional()
  ),
  email: z.string().email().transform((val) => val.toLowerCase().trim()),
  tags: z.preprocess(
    (val) => (typeof val === 'string' ? val.split(',').map((s) => s.trim()) : val),
    z.array(z.string()).max(5)
  )
});

// 异步验证
const usernameSchema = z.string().refine(
  async (username) => {
    const response = await fetch(`/api/check-username?username=${username}`);
    const { available } = await response.json();
    return available;
  },
  { message: '用户名已被占用' }
);
```

### Zod 与 TypeScript

```typescript
import { z } from 'zod';

// 创建与 API 类型匹配的模式
const apiUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  profile: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatar: z.string().url().optional()
  }).optional()
});

type ApiUser = z.infer<typeof apiUserSchema>;

// 表单输入模式(与 API 模式不同)
const userFormSchema = apiUserSchema
  .omit({ id: true, createdAt: true })
  .extend({
    password: z.string().min(8)
  });

type UserFormInput = z.infer<typeof userFormSchema>;

// 用于更新的部分模式
const updateUserSchema = userFormSchema.partial();

type UpdateUserInput = z.infer<typeof updateUserSchema>;

// 表单验证工具函数
function validateForm<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });

  return { success: false, errors };
}
```

## 使用 Yup 进行模式验证

### Yup 简介

Yup 是另一个流行的模式验证库,以其表达力强的 API 和广泛采用而闻名。

```bash
npm install yup
```

### 基本 Yup 模式

```typescript
import * as yup from 'yup';

// 定义模式
const userSchema = yup.object({
  username: yup
    .string()
    .required('用户名为必填项')
    .min(3, '用户名必须至少3个字符')
    .max(20, '用户名最多20个字符'),
  email: yup
    .string()
    .required('邮箱为必填项')
    .email('无效的邮箱地址'),
  age: yup
    .number()
    .positive('年龄必须为正数')
    .integer('年龄必须为整数')
    .min(18, '必须年满18岁')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value
    ),
  website: yup.string().url('无效的URL').nullable()
});

// 推断类型
type User = yup.InferType<typeof userSchema>;

// 验证
async function validateUser(data: unknown) {
  try {
    const validData = await userSchema.validate(data, { abortEarly: false });
    return { success: true, data: validData };
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      const errors: Record<string, string> = {};
      err.inner.forEach((e) => {
        if (e.path) {
          errors[e.path] = e.message;
        }
      });
      return { success: false, errors };
    }
    throw err;
  }
}
```

### 高级 Yup 模式

```typescript
import * as yup from 'yup';

// 带确认的密码
const registrationSchema = yup.object({
  password: yup
    .string()
    .required('密码为必填项')
    .min(8, '密码必须至少8个字符')
    .matches(/[a-z]/, '必须包含小写字母')
    .matches(/[A-Z]/, '必须包含大写字母')
    .matches(/[0-9]/, '必须包含数字'),
  confirmPassword: yup
    .string()
    .required('请确认您的密码')
    .oneOf([yup.ref('password')], '密码必须匹配')
});

// 使用 when() 进行条件验证
const shippingSchema = yup.object({
  sameAsBilling: yup.boolean(),
  shippingAddress: yup.string().when('sameAsBilling', {
    is: false,
    then: (schema) => schema.required('收货地址为必填项'),
    otherwise: (schema) => schema.notRequired()
  })
});

// 数组验证
const orderSchema = yup.object({
  items: yup
    .array()
    .of(
      yup.object({
        productId: yup.string().required(),
        quantity: yup.number().min(1).required(),
        price: yup.number().positive().required()
      })
    )
    .min(1, '至少需要一个商品')
    .required()
});

// 自定义测试
const usernameSchema = yup
  .string()
  .required()
  .test(
    'unique-username',
    '用户名已被占用',
    async (value) => {
      if (!value) return true;
      const response = await fetch(`/api/check-username?username=${value}`);
      const { available } = await response.json();
      return available;
    }
  );

// 日期验证
const eventSchema = yup.object({
  startDate: yup.date().required().min(new Date(), '开始日期必须在未来'),
  endDate: yup
    .date()
    .required()
    .min(yup.ref('startDate'), '结束日期必须在开始日期之后')
});
```

### Zod 与 Yup 对比

| 特性 | Zod | Yup |
|---------|-----|-----|
| TypeScript | 一流支持 | 良好支持 |
| 包大小 | ~12KB | ~15KB |
| 类型推断 | 优秀 | 良好 |
| 异步验证 | 支持 | 支持 |
| 条件验证 | `.refine()`, `.superRefine()` | `.when()` |
| 生态系统 | 成长中 | 成熟 |
| 学习曲线 | 中等 | 简单 |

## React Hook Form 集成

### 设置和基本用法

React Hook Form 是一个高性能的表单库,可以最小化重新渲染,并提供出色的验证集成。

```bash
npm install react-hook-form @hookform/resolvers zod
```

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('无效的邮箱地址'),
  password: z.string().min(8, '密码必须至少8个字符')
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginUser(data);
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email">邮箱</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">密码</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span id="password-error" role="alert">
            {errors.password.message}
          </span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

### 高级 React Hook Form 模式

```tsx
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 复杂表单模式
const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, '姓名为必填项'),
    email: z.string().email('无效的邮箱')
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, '产品为必填项'),
        quantity: z.number().min(1, '数量至少为1'),
        notes: z.string().optional()
      })
    )
    .min(1, '至少需要一个商品'),
  shippingMethod: z.enum(['standard', 'express', 'overnight']),
  giftWrap: z.boolean().default(false),
  giftMessage: z.string().optional()
}).refine(
  (data) => !data.giftWrap || data.giftMessage,
  {
    message: '选择礼品包装时需要填写礼品留言',
    path: ['giftMessage']
  }
);

type OrderFormData = z.infer<typeof orderSchema>;

function OrderForm() {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      items: [{ productId: '', quantity: 1 }],
      shippingMethod: 'standard',
      giftWrap: false
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const giftWrap = watch('giftWrap');

  const onSubmit = (data: OrderFormData) => {
    console.log('订单已提交:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 客户信息 */}
      <fieldset>
        <legend>客户信息</legend>
        <div>
          <label htmlFor="customer.name">姓名</label>
          <input id="customer.name" {...register('customer.name')} />
          {errors.customer?.name && (
            <span role="alert">{errors.customer.name.message}</span>
          )}
        </div>
        <div>
          <label htmlFor="customer.email">邮箱</label>
          <input id="customer.email" type="email" {...register('customer.email')} />
          {errors.customer?.email && (
            <span role="alert">{errors.customer.email.message}</span>
          )}
        </div>
      </fieldset>

      {/* 动态商品 */}
      <fieldset>
        <legend>订单商品</legend>
        {fields.map((field, index) => (
          <div key={field.id}>
            <select {...register(`items.${index}.productId`)}>
              <option value="">选择产品</option>
              <option value="prod-1">产品 1</option>
              <option value="prod-2">产品 2</option>
            </select>

            <Controller
              name={`items.${index}.quantity`}
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              )}
            />

            <input {...register(`items.${index}.notes`)} placeholder="备注" />

            {fields.length > 1 && (
              <button type="button" onClick={() => remove(index)}>
                删除
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ productId: '', quantity: 1 })}
        >
          添加商品
        </button>

        {errors.items && (
          <span role="alert">{errors.items.message}</span>
        )}
      </fieldset>

      {/* 配送方式 */}
      <fieldset>
        <legend>配送方式</legend>
        <select {...register('shippingMethod')}>
          <option value="standard">标准配送 (5-7天)</option>
          <option value="express">快速配送 (2-3天)</option>
          <option value="overnight">隔夜送达</option>
        </select>
      </fieldset>

      {/* 礼品选项 */}
      <fieldset>
        <legend>礼品选项</legend>
        <label>
          <input type="checkbox" {...register('giftWrap')} />
          礼品包装
        </label>

        {giftWrap && (
          <div>
            <label htmlFor="giftMessage">礼品留言</label>
            <textarea id="giftMessage" {...register('giftMessage')} />
            {errors.giftMessage && (
              <span role="alert">{errors.giftMessage.message}</span>
            )}
          </div>
        )}
      </fieldset>

      <button type="submit">下单</button>
    </form>
  );
}
```

### 使用 React Hook Form 的自定义输入组件

```tsx
import { useForm, Controller, useFormContext, FormProvider } from 'react-hook-form';
import { forwardRef } from 'react';

// 可复用的输入组件
interface TextInputProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}

function TextInput({ name, label, type = 'text', placeholder }: TextInputProps) {
  const {
    register,
    formState: { errors }
  } = useFormContext();

  const error = errors[name];

  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <span id={`${name}-error`} className="error" role="alert">
          {error.message as string}
        </span>
      )}
    </div>
  );
}

// 使用 Controller 的选择组件
interface SelectInputProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

function SelectInput({ name, label, options }: SelectInputProps) {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            id={name}
            {...field}
            aria-invalid={error ? 'true' : 'false'}
          >
            <option value="">请选择</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      />
      {error && (
        <span className="error" role="alert">
          {error.message as string}
        </span>
      )}
    </div>
  );
}

// 使用 FormProvider
function RegistrationForm() {
  const methods = useForm({
    resolver: zodResolver(registrationSchema)
  });

  const onSubmit = (data: RegistrationFormData) => {
    console.log(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <TextInput name="username" label="用户名" />
        <TextInput name="email" label="邮箱" type="email" />
        <TextInput name="password" label="密码" type="password" />
        <SelectInput
          name="role"
          label="角色"
          options={[
            { value: 'user', label: '用户' },
            { value: 'admin', label: '管理员' }
          ]}
        />
        <button type="submit">注册</button>
      </form>
    </FormProvider>
  );
}
```

## 错误处理和显示

### 错误消息策略

```tsx
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';

// 动画错误消息
function FormField({ name, label, register, errors }) {
  const error = errors[name];

  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        {...register(name)}
        className={error ? 'input-error' : ''}
      />
      <AnimatePresence mode="wait">
        {error && (
          <motion.span
            className="error-message"
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {error.message}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// 错误摘要组件
function ErrorSummary({ errors }) {
  const errorList = Object.entries(errors);

  if (errorList.length === 0) return null;

  return (
    <div role="alert" aria-labelledby="error-summary-title" className="error-summary">
      <h2 id="error-summary-title">请修复以下错误:</h2>
      <ul>
        {errorList.map(([field, error]) => (
          <li key={field}>
            <a href={`#${field}`}>
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 表单错误的 Toast 通知
function useFormErrorToast() {
  const showToast = useToast();

  return (errors: FieldErrors) => {
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      showToast({
        type: 'error',
        message: `请修复表单中的 ${errorCount} 个错误`,
        duration: 5000
      });
    }
  };
}
```

### 服务器端错误处理

```tsx
import { useForm } from 'react-hook-form';
import { useState } from 'react';

interface ApiError {
  field: string;
  message: string;
}

function RegistrationForm() {
  const [serverErrors, setServerErrors] = useState<ApiError[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data: FormData) => {
    setServerErrors([]);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 处理字段特定错误
        if (errorData.errors) {
          errorData.errors.forEach((err: ApiError) => {
            setError(err.field as any, {
              type: 'server',
              message: err.message
            });
          });
        }

        // 处理通用错误
        if (errorData.message) {
          setServerErrors([{ field: 'general', message: errorData.message }]);
        }

        return;
      }

      // 成功处理
      const result = await response.json();
      console.log('注册成功:', result);
    } catch (error) {
      setServerErrors([
        { field: 'general', message: '发生意外错误,请重试。' }
      ]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {serverErrors.length > 0 && (
        <div role="alert" className="server-errors">
          {serverErrors.map((err, index) => (
            <p key={index}>{err.message}</p>
          ))}
        </div>
      )}

      {/* 表单字段 */}
      <input {...register('email')} />
      {errors.email && <span role="alert">{errors.email.message}</span>}

      <button type="submit">注册</button>
    </form>
  );
}
```

## 表单验证的无障碍性

### ARIA 属性和标签

```tsx
function AccessibleFormField({
  id,
  label,
  error,
  required,
  description,
  register,
  ...props
}) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="sr-only"> (必填)</span>}
      </label>

      {description && (
        <p id={descriptionId} className="field-description">
          {description}
        </p>
      )}

      <input
        id={id}
        {...register(id)}
        {...props}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[
          description ? descriptionId : null,
          error ? errorId : null
        ].filter(Boolean).join(' ') || undefined}
        aria-required={required}
      />

      {error && (
        <p id={errorId} className="error-message" role="alert">
          <span className="sr-only">错误: </span>
          {error.message}
        </p>
      )}
    </div>
  );
}

// 仅屏幕阅读器可见的类
// .sr-only { position: absolute; width: 1px; height: 1px; padding: 0;
//            margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0);
//            white-space: nowrap; border: 0; }
```

### 焦点管理

```tsx
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

function FormWithFocusManagement() {
  const formRef = useRef<HTMLFormElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful }
  } = useForm();

  // 提交时聚焦第一个错误字段
  useEffect(() => {
    const errorFields = Object.keys(errors);
    if (errorFields.length > 0) {
      // 为屏幕阅读器聚焦错误摘要
      errorSummaryRef.current?.focus();

      // 或者聚焦第一个错误字段
      const firstErrorField = formRef.current?.querySelector(
        `[name="${errorFields[0]}"]`
      ) as HTMLElement;
      firstErrorField?.focus();
    }
  }, [errors]);

  const onSubmit = (data: FormData) => {
    console.log('已提交:', data);
  };

  const onError = () => {
    // 焦点将由 useEffect 处理
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onSubmit, onError)}
      noValidate
    >
      {Object.keys(errors).length > 0 && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="error-heading"
        >
          <h2 id="error-heading">您的提交存在错误</h2>
          <ul>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <a href={`#${field}`} onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(field)?.focus();
                }}>
                  {error.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="email">邮箱</label>
        <input id="email" type="email" {...register('email')} />
      </div>

      <button type="submit">提交</button>
    </form>
  );
}
```

### 键盘导航

```tsx
function AccessibleForm() {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // 仅当焦点在提交按钮上时才允许 Enter 提交
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      const form = e.currentTarget;
      const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
      const currentIndex = inputs.indexOf(e.target);

      if (currentIndex < inputs.length - 1) {
        e.preventDefault();
        (inputs[currentIndex + 1] as HTMLElement).focus();
      }
    }
  };

  return (
    <form onKeyDown={handleKeyDown}>
      {/* 具有正确 Tab 顺序的表单字段 */}
      <input tabIndex={0} name="firstName" />
      <input tabIndex={0} name="lastName" />
      <input tabIndex={0} name="email" type="email" />
      <button tabIndex={0} type="submit">提交</button>
    </form>
  );
}
```

## 实时验证模式

### 防抖验证

```tsx
import { useForm } from 'react-hook-form';
import { useCallback, useState } from 'react';
import debounce from 'lodash/debounce';

function FormWithDebouncedValidation() {
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const {
    register,
    formState: { errors },
    trigger,
    watch
  } = useForm({
    mode: 'onChange' // 在更改时验证
  });

  // 防抖异步用户名检查
  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (!username || username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      setChecking(true);
      try {
        const response = await fetch(
          `/api/check-username?username=${encodeURIComponent(username)}`
        );
        const { available } = await response.json();
        setUsernameAvailable(available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 500),
    []
  );

  const username = watch('username');

  useEffect(() => {
    checkUsername(username);
  }, [username, checkUsername]);

  return (
    <form>
      <div className="form-field">
        <label htmlFor="username">用户名</label>
        <div className="input-with-status">
          <input
            id="username"
            {...register('username', {
              required: '用户名为必填项',
              minLength: {
                value: 3,
                message: '用户名必须至少3个字符'
              }
            })}
            aria-describedby="username-status"
          />
          <span id="username-status" aria-live="polite">
            {checking && <span className="checking">检查中...</span>}
            {!checking && usernameAvailable === true && (
              <span className="available">可用</span>
            )}
            {!checking && usernameAvailable === false && (
              <span className="taken">用户名已被占用</span>
            )}
          </span>
        </div>
        {errors.username && (
          <span role="alert">{errors.username.message}</span>
        )}
      </div>
    </form>
  );
}
```

### 渐进式验证

```tsx
import { useForm } from 'react-hook-form';

function ProgressiveValidationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, touchedFields },
    trigger
  } = useForm({
    mode: 'onTouched', // 首先在失焦时验证
    reValidateMode: 'onChange' // 然后在触摸后的每次更改时重新验证
  });

  // 失焦时的自定义验证触发
  const handleBlur = async (fieldName: string) => {
    await trigger(fieldName);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('email', {
            required: '邮箱为必填项',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: '邮箱格式无效'
            }
          })}
          onBlur={() => handleBlur('email')}
        />
        {/* 仅在字段被触摸后显示错误 */}
        {touchedFields.email && errors.email && (
          <span role="alert">{errors.email.message}</span>
        )}
      </div>

      <div>
        <input
          type="password"
          {...register('password', {
            required: '密码为必填项',
            minLength: {
              value: 8,
              message: '密码必须至少8个字符'
            }
          })}
          onBlur={() => handleBlur('password')}
        />
        {touchedFields.password && errors.password && (
          <span role="alert">{errors.password.message}</span>
        )}
      </div>

      <button type="submit">提交</button>
    </form>
  );
}
```

### 密码强度指示器

```tsx
import { useState, useEffect } from 'react';

interface PasswordStrength {
  score: number;
  label: string;
  feedback: string[];
}

function calculatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('至少使用8个字符');
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('添加小写字母');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('添加大写字母');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('添加数字');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('添加特殊字符');
  }

  const labels = ['非常弱', '弱', '一般', '良好', '强', '非常强'];
  const label = labels[Math.min(score, labels.length - 1)];

  return { score, label, feedback };
}

function PasswordInput({ register, errors }) {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (password) {
      setStrength(calculatePasswordStrength(password));
    } else {
      setStrength(null);
    }
  }, [password]);

  return (
    <div className="form-field">
      <label htmlFor="password">密码</label>
      <input
        id="password"
        type="password"
        {...register('password', {
          required: '密码为必填项',
          onChange: (e) => setPassword(e.target.value)
        })}
        aria-describedby="password-strength"
      />

      {strength && (
        <div id="password-strength" aria-live="polite">
          <div className="strength-meter">
            <div
              className={`strength-fill strength-${strength.score}`}
              style={{ width: `${(strength.score / 6) * 100}%` }}
            />
          </div>
          <span className={`strength-label strength-${strength.score}`}>
            {strength.label}
          </span>
          {strength.feedback.length > 0 && (
            <ul className="strength-feedback">
              {strength.feedback.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {errors.password && (
        <span role="alert">{errors.password.message}</span>
      )}
    </div>
  );
}
```

## 多步骤表单验证

### 向导表单模式

```tsx
import { useState } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 每个步骤的模式
const step1Schema = z.object({
  firstName: z.string().min(1, '名字为必填项'),
  lastName: z.string().min(1, '姓氏为必填项'),
  email: z.string().email('无效的邮箱')
});

const step2Schema = z.object({
  address: z.string().min(1, '地址为必填项'),
  city: z.string().min(1, '城市为必填项'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, '无效的邮政编码')
});

const step3Schema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, '无效的卡号'),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, '格式: MM/YY'),
  cvv: z.string().regex(/^\d{3,4}$/, '无效的CVV')
});

// 合并的模式
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type FormData = z.infer<typeof fullSchema>;

const steps = [
  { schema: step1Schema, title: '个人信息' },
  { schema: step2Schema, title: '收货地址' },
  { schema: step3Schema, title: '支付详情' }
];

function WizardForm() {
  const [currentStep, setCurrentStep] = useState(0);

  const methods = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    mode: 'onChange'
  });

  const { trigger, getValues, handleSubmit } = methods;

  const validateStep = async () => {
    const currentSchema = steps[currentStep].schema;
    const fields = Object.keys(currentSchema.shape) as (keyof FormData)[];
    const isValid = await trigger(fields);
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: FormData) => {
    console.log('表单已提交:', data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 进度指示器 */}
        <div className="progress" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemax={steps.length}>
          {steps.map((step, index) => (
            <div
              key={index}
              className={`step ${index <= currentStep ? 'active' : ''}`}
              aria-current={index === currentStep ? 'step' : undefined}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-title">{step.title}</span>
            </div>
          ))}
        </div>

        {/* 步骤内容 */}
        <div className="step-content">
          {currentStep === 0 && <Step1 />}
          {currentStep === 1 && <Step2 />}
          {currentStep === 2 && <Step3 />}
        </div>

        {/* 导航 */}
        <div className="wizard-nav">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            上一步
          </button>

          {currentStep < steps.length - 1 ? (
            <button type="button" onClick={nextStep}>
              下一步
            </button>
          ) : (
            <button type="submit">提交</button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

// 步骤组件
function Step1() {
  const { register, formState: { errors } } = useFormContext<FormData>();

  return (
    <div>
      <h2>个人信息</h2>
      <div>
        <label htmlFor="firstName">名字</label>
        <input id="firstName" {...register('firstName')} />
        {errors.firstName && <span role="alert">{errors.firstName.message}</span>}
      </div>
      <div>
        <label htmlFor="lastName">姓氏</label>
        <input id="lastName" {...register('lastName')} />
        {errors.lastName && <span role="alert">{errors.lastName.message}</span>}
      </div>
      <div>
        <label htmlFor="email">邮箱</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <span role="alert">{errors.email.message}</span>}
      </div>
    </div>
  );
}

function Step2() {
  const { register, formState: { errors } } = useFormContext<FormData>();

  return (
    <div>
      <h2>收货地址</h2>
      <div>
        <label htmlFor="address">街道地址</label>
        <input id="address" {...register('address')} />
        {errors.address && <span role="alert">{errors.address.message}</span>}
      </div>
      <div>
        <label htmlFor="city">城市</label>
        <input id="city" {...register('city')} />
        {errors.city && <span role="alert">{errors.city.message}</span>}
      </div>
      <div>
        <label htmlFor="zipCode">邮政编码</label>
        <input id="zipCode" {...register('zipCode')} />
        {errors.zipCode && <span role="alert">{errors.zipCode.message}</span>}
      </div>
    </div>
  );
}

function Step3() {
  const { register, formState: { errors } } = useFormContext<FormData>();

  return (
    <div>
      <h2>支付详情</h2>
      <div>
        <label htmlFor="cardNumber">卡号</label>
        <input id="cardNumber" {...register('cardNumber')} />
        {errors.cardNumber && <span role="alert">{errors.cardNumber.message}</span>}
      </div>
      <div>
        <label htmlFor="expiryDate">有效期</label>
        <input id="expiryDate" placeholder="MM/YY" {...register('expiryDate')} />
        {errors.expiryDate && <span role="alert">{errors.expiryDate.message}</span>}
      </div>
      <div>
        <label htmlFor="cvv">CVV</label>
        <input id="cvv" type="password" {...register('cvv')} />
        {errors.cvv && <span role="alert">{errors.cvv.message}</span>}
      </div>
    </div>
  );
}
```

## 测试表单验证

### 验证逻辑单元测试

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('无效的邮箱'),
  password: z.string().min(8, '密码太短')
});

describe('用户验证模式', () => {
  it('应该接受有效数据', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(result.success).toBe(true);
  });

  it('应该拒绝无效邮箱', () => {
    const result = userSchema.safeParse({
      email: 'invalid-email',
      password: 'password123'
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('无效的邮箱');
    }
  });

  it('应该拒绝太短的密码', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      password: 'short'
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('密码太短');
    }
  });
});
```

### 使用 React Testing Library 进行集成测试

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('应该为空字段显示验证错误', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /提交/i }));

    await waitFor(() => {
      expect(screen.getByText(/邮箱为必填项/i)).toBeInTheDocument();
      expect(screen.getByText(/密码为必填项/i)).toBeInTheDocument();
    });
  });

  it('应该为无效邮箱显示错误', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/邮箱/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /提交/i }));

    await waitFor(() => {
      expect(screen.getByText(/无效的邮箱/i)).toBeInTheDocument();
    });
  });

  it('应该使用有效数据提交表单', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/邮箱/i), 'test@example.com');
    await user.type(screen.getByLabelText(/密码/i), 'password123');
    await user.click(screen.getByRole('button', { name: /提交/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('应该在用户开始输入时清除错误', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    // 触发验证错误
    await user.click(screen.getByRole('button', { name: /提交/i }));

    await waitFor(() => {
      expect(screen.getByText(/邮箱为必填项/i)).toBeInTheDocument();
    });

    // 开始输入以清除错误
    await user.type(screen.getByLabelText(/邮箱/i), 'test@example.com');

    await waitFor(() => {
      expect(screen.queryByText(/邮箱为必填项/i)).not.toBeInTheDocument();
    });
  });
});
```

## 面试问题

### 常见问题和答案

**问题1: 客户端验证和服务器端验证有什么区别?**

```
客户端验证:
- 在表单提交前在浏览器中运行
- 为用户提供即时反馈
- 改善用户体验
- 可以被绕过(如果单独使用存在安全风险)

服务器端验证:
- 在表单提交后在服务器上运行
- 用户无法绕过
- 对安全性至关重要
- 提供最终的数据完整性检查

最佳实践: 始终同时使用两者。客户端用于用户体验,服务器端用于安全性。
```

**问题2: 如何处理异步验证(例如,检查用户名是否可用)?**

```typescript
// 使用 Zod
const usernameSchema = z.string().refine(
  async (username) => {
    const response = await checkUsernameAvailability(username);
    return response.available;
  },
  { message: '用户名已被占用' }
);

// 使用 React Hook Form
const { setError, clearErrors } = useForm();

const checkUsername = debounce(async (username) => {
  const available = await checkUsernameAvailability(username);
  if (!available) {
    setError('username', { message: '用户名已被占用' });
  } else {
    clearErrors('username');
  }
}, 500);
```

**问题3: 如何使表单验证具有无障碍性?**

```tsx
// 关键的无障碍实践:
<div>
  {/* 1. 将标签与输入关联 */}
  <label htmlFor="email">邮箱</label>

  {/* 2. 使用 aria-invalid 表示无效状态 */}
  <input
    id="email"
    aria-invalid={error ? 'true' : 'false'}

    {/* 3. 使用 aria-describedby 连接错误消息 */}
    aria-describedby={error ? 'email-error' : undefined}

    {/* 4. 标记必填字段 */}
    aria-required="true"
  />

  {/* 5. 为错误消息使用 role="alert" */}
  {error && (
    <span id="email-error" role="alert">
      {error.message}
    </span>
  )}
</div>
```

**问题4: 什么时候应该使用 Zod,什么时候使用 Yup?**

```
选择 Zod 当:
- TypeScript 是优先考虑的
- 您需要出色的类型推断
- 您喜欢更现代的 API
- 包大小很重要

选择 Yup 当:
- 您需要成熟的生态系统支持
- 您已经熟悉它
- 您需要广泛的条件验证
- 您喜欢方法链式语法
```

**问题5: 如何在不影响性能的情况下实现实时验证?**

```typescript
// 对昂贵的验证使用防抖
const debouncedValidate = useMemo(
  () => debounce((value) => validateAsync(value), 300),
  []
);

// 在 React Hook Form 中使用模式配置
useForm({
  mode: 'onTouched',      // 首先在失焦时验证
  reValidateMode: 'onChange' // 然后在每次更改时重新验证
});

// 避免对复杂规则在每次按键时验证
// 相反,对复杂字段在失焦时验证
```

## 总结

表单验证是前端开发者的基本技能。本指南涵盖了:

1. **原生 HTML5 验证**: 利用浏览器内置支持快速设置
2. **JavaScript 基础**: 构建自定义验证逻辑
3. **模式验证**: 使用 Zod 和 Yup 进行类型安全的验证
4. **React Hook Form**: 高性能的表单管理与验证集成
5. **错误处理**: 用户友好的错误显示策略
6. **无障碍性**: 使表单对所有人都可用
7. **实时验证**: 即时反馈而不影响性能
8. **测试**: 确保验证逻辑正常工作

关键要点:

- 始终在客户端和服务器端都进行验证
- 使用模式验证以确保类型安全和一致性
- 在错误处理中优先考虑无障碍性
- 对昂贵的验证进行防抖处理
- 彻底测试验证逻辑
- 提供清晰、可操作的错误消息

通过遵循这些最佳实践,您可以创建安全、无障碍且提供出色用户体验的表单。

## 延伸阅读

### 官方文档

- [React Hook Form 文档](https://react-hook-form.com/)
- [Zod 文档](https://zod.dev/)
- [Yup 文档](https://github.com/jquense/yup)
- [MDN: 客户端表单验证](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)

### 相关主题

- **TypeScript**: 用于类型安全的表单处理
- **无障碍性 (WCAG)**: 用于包容性表单设计
- **Testing Library**: 用于测试表单交互
- **状态管理**: 用于复杂表单状态场景
