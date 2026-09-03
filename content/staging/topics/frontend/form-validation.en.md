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
origin: old/src/content/docs/frontend/form-validation.en.md
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

Form validation is a critical aspect of web development that ensures data integrity, improves user experience, and prevents malicious input from reaching your server. This comprehensive guide covers everything from basic client-side validation to advanced schema validation with modern libraries like Zod and React Hook Form.

## Why Form Validation Matters

### The Importance of Validation

Form validation serves multiple purposes in modern web applications:

1. **Data Integrity**: Ensures that only properly formatted data is submitted
2. **User Experience**: Provides immediate feedback to help users correct mistakes
3. **Security**: Acts as the first line of defense against malicious input
4. **Server Load Reduction**: Prevents unnecessary server requests with invalid data
5. **Accessibility**: Helps users with disabilities understand form requirements

### Client-Side vs Server-Side Validation

```
+-------------------+     +-------------------+
|  Client-Side      |     |  Server-Side      |
|  Validation       |     |  Validation       |
+-------------------+     +-------------------+
| - Instant feedback|     | - Security layer  |
| - Better UX       |     | - Data integrity  |
| - Reduces load    |     | - Business rules  |
| - Can be bypassed |     | - Always required |
+-------------------+     +-------------------+
        |                         |
        v                         v
   First Defense            Final Authority
```

**Important**: Never rely solely on client-side validation. Always validate on the server as well, since client-side validation can be bypassed.

## Native HTML5 Validation

### Built-in Validation Attributes

HTML5 provides several validation attributes that work without JavaScript:

```html
<form id="registration-form">
  <!-- Required field -->
  <input type="text" name="username" required />

  <!-- Email validation -->
  <input type="email" name="email" required />

  <!-- Minimum and maximum length -->
  <input type="text" name="nickname" minlength="3" maxlength="20" />

  <!-- Number range -->
  <input type="number" name="age" min="18" max="120" />

  <!-- Pattern matching with regex -->
  <input
    type="text"
    name="phone"
    pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
    title="Format: 123-456-7890"
  />

  <!-- URL validation -->
  <input type="url" name="website" />

  <button type="submit">Submit</button>
</form>
```

### Custom Validation Messages

```javascript
const form = document.getElementById('registration-form');
const emailInput = form.querySelector('input[name="email"]');

emailInput.addEventListener('invalid', (e) => {
  e.target.setCustomValidity('Please enter a valid email address');
});

emailInput.addEventListener('input', (e) => {
  e.target.setCustomValidity(''); // Clear custom message on input
});
```

### Styling Validation States

```css
/* Valid input */
input:valid {
  border-color: #22c55e;
}

/* Invalid input */
input:invalid {
  border-color: #ef4444;
}

/* Only show invalid state after user interaction */
input:not(:placeholder-shown):invalid {
  border-color: #ef4444;
  background-color: #fef2f2;
}

/* Focus states */
input:focus:invalid {
  outline-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}
```

### Limitations of HTML5 Validation

While useful, HTML5 validation has limitations:

- Limited customization of error messages
- Inconsistent styling across browsers
- No support for complex validation rules
- Cannot validate dependent fields
- No async validation support

## JavaScript Validation Fundamentals

### Basic Validation Patterns

```javascript
class FormValidator {
  constructor(form) {
    this.form = form;
    this.errors = {};
  }

  validate() {
    this.errors = {};
    const formData = new FormData(this.form);

    // Validate each field
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
      this.errors[field] = 'This field is required';
    }
  }

  validateEmail(field, value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      this.errors[field] = 'Please enter a valid email address';
    }
  }

  validatePassword(field, value) {
    if (value && value.length < 8) {
      this.errors[field] = 'Password must be at least 8 characters';
    }

    if (value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      this.errors[field] =
        'Password must contain uppercase, lowercase, and number';
    }
  }

  validatePasswordConfirm(password, confirmPassword) {
    if (password !== confirmPassword) {
      this.errors['confirmPassword'] = 'Passwords do not match';
    }
  }

  getErrors() {
    return this.errors;
  }
}

// Usage
const form = document.getElementById('signup-form');
const validator = new FormValidator(form);

form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (validator.validate()) {
    // Submit form
    form.submit();
  } else {
    // Display errors
    displayErrors(validator.getErrors());
  }
});
```

### Reusable Validation Functions

```javascript
// validation-rules.js
export const validationRules = {
  required: (value, message = 'This field is required') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },

  email: (value, message = 'Invalid email address') => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },

  minLength: (min) => (value, message) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value, message) => {
    if (value && value.length > max) {
      return message || `Must be no more than ${max} characters`;
    }
    return null;
  },

  pattern: (regex, defaultMessage) => (value, message) => {
    if (value && !regex.test(value)) {
      return message || defaultMessage || 'Invalid format';
    }
    return null;
  },

  matches: (fieldToMatch, fieldName) => (value, _, formData) => {
    if (value !== formData[fieldToMatch]) {
      return `Must match ${fieldName}`;
    }
    return null;
  },

  // Composable validator
  compose: (...validators) => (value, message, formData) => {
    for (const validator of validators) {
      const error = validator(value, message, formData);
      if (error) return error;
    }
    return null;
  }
};

// Usage example
const { required, email, minLength, compose } = validationRules;

const userValidation = {
  email: compose(required, email),
  password: compose(required, minLength(8)),
  username: compose(required, minLength(3))
};
```

## Schema Validation with Zod

### Introduction to Zod

Zod is a TypeScript-first schema validation library that provides type inference, making it perfect for modern TypeScript applications.

```bash
npm install zod
```

### Basic Zod Schemas

```typescript
import { z } from 'zod';

// Simple schema
const userSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().min(18).max(120).optional(),
  website: z.string().url().optional()
});

// Type inference
type User = z.infer<typeof userSchema>;
// { username: string; email: string; age?: number; website?: string }

// Validation
const result = userSchema.safeParse({
  username: 'johndoe',
  email: 'john@example.com',
  age: 25
});

if (result.success) {
  console.log(result.data); // Typed as User
} else {
  console.log(result.error.issues);
}
```

### Advanced Zod Patterns

```typescript
import { z } from 'zod';

// Custom error messages
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
});

// Password validation with custom rules
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain a special character');

// Registration form with password confirmation
const registrationSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

// Conditional validation
const paymentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('credit_card'),
    cardNumber: z.string().regex(/^\d{16}$/, 'Invalid card number'),
    expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
    cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV')
  }),
  z.object({
    method: z.literal('paypal'),
    paypalEmail: z.string().email('Invalid PayPal email')
  }),
  z.object({
    method: z.literal('bank_transfer'),
    accountNumber: z.string().min(10, 'Invalid account number'),
    routingNumber: z.string().length(9, 'Routing number must be 9 digits')
  })
]);

// Transform and preprocess
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

// Async validation
const usernameSchema = z.string().refine(
  async (username) => {
    const response = await fetch(`/api/check-username?username=${username}`);
    const { available } = await response.json();
    return available;
  },
  { message: 'Username is already taken' }
);
```

### Zod with TypeScript

```typescript
import { z } from 'zod';

// Create schemas that match your API types
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

// Form input schema (different from API schema)
const userFormSchema = apiUserSchema
  .omit({ id: true, createdAt: true })
  .extend({
    password: z.string().min(8)
  });

type UserFormInput = z.infer<typeof userFormSchema>;

// Partial schema for updates
const updateUserSchema = userFormSchema.partial();

type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Utility function for form validation
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

## Schema Validation with Yup

### Introduction to Yup

Yup is another popular schema validation library, known for its expressive API and wide adoption.

```bash
npm install yup
```

### Basic Yup Schemas

```typescript
import * as yup from 'yup';

// Define schema
const userSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email address'),
  age: yup
    .number()
    .positive('Age must be positive')
    .integer('Age must be an integer')
    .min(18, 'Must be at least 18 years old')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value
    ),
  website: yup.string().url('Invalid URL').nullable()
});

// Infer type
type User = yup.InferType<typeof userSchema>;

// Validate
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

### Advanced Yup Patterns

```typescript
import * as yup from 'yup';

// Password with confirmation
const registrationSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain a lowercase letter')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/[0-9]/, 'Must contain a number'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match')
});

// Conditional validation with when()
const shippingSchema = yup.object({
  sameAsBilling: yup.boolean(),
  shippingAddress: yup.string().when('sameAsBilling', {
    is: false,
    then: (schema) => schema.required('Shipping address is required'),
    otherwise: (schema) => schema.notRequired()
  })
});

// Array validation
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
    .min(1, 'At least one item is required')
    .required()
});

// Custom test
const usernameSchema = yup
  .string()
  .required()
  .test(
    'unique-username',
    'Username is already taken',
    async (value) => {
      if (!value) return true;
      const response = await fetch(`/api/check-username?username=${value}`);
      const { available } = await response.json();
      return available;
    }
  );

// Date validation
const eventSchema = yup.object({
  startDate: yup.date().required().min(new Date(), 'Start date must be in the future'),
  endDate: yup
    .date()
    .required()
    .min(yup.ref('startDate'), 'End date must be after start date')
});
```

### Zod vs Yup Comparison

| Feature | Zod | Yup |
|---------|-----|-----|
| TypeScript | First-class support | Good support |
| Bundle size | ~12KB | ~15KB |
| Type inference | Excellent | Good |
| Async validation | Supported | Supported |
| Conditional validation | `.refine()`, `.superRefine()` | `.when()` |
| Ecosystem | Growing | Mature |
| Learning curve | Moderate | Easy |

## React Hook Form Integration

### Setup and Basic Usage

React Hook Form is a performant form library that minimizes re-renders and provides excellent validation integration.

```bash
npm install react-hook-form @hookform/resolvers zod
```

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
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
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email">Email</label>
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
        <label htmlFor="password">Password</label>
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
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
```

### Advanced React Hook Form Patterns

```tsx
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Complex form schema
const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email')
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        notes: z.string().optional()
      })
    )
    .min(1, 'At least one item is required'),
  shippingMethod: z.enum(['standard', 'express', 'overnight']),
  giftWrap: z.boolean().default(false),
  giftMessage: z.string().optional()
}).refine(
  (data) => !data.giftWrap || data.giftMessage,
  {
    message: 'Gift message is required when gift wrap is selected',
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
    console.log('Order submitted:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Customer info */}
      <fieldset>
        <legend>Customer Information</legend>
        <div>
          <label htmlFor="customer.name">Name</label>
          <input id="customer.name" {...register('customer.name')} />
          {errors.customer?.name && (
            <span role="alert">{errors.customer.name.message}</span>
          )}
        </div>
        <div>
          <label htmlFor="customer.email">Email</label>
          <input id="customer.email" type="email" {...register('customer.email')} />
          {errors.customer?.email && (
            <span role="alert">{errors.customer.email.message}</span>
          )}
        </div>
      </fieldset>

      {/* Dynamic items */}
      <fieldset>
        <legend>Order Items</legend>
        {fields.map((field, index) => (
          <div key={field.id}>
            <select {...register(`items.${index}.productId`)}>
              <option value="">Select product</option>
              <option value="prod-1">Product 1</option>
              <option value="prod-2">Product 2</option>
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

            <input {...register(`items.${index}.notes`)} placeholder="Notes" />

            {fields.length > 1 && (
              <button type="button" onClick={() => remove(index)}>
                Remove
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ productId: '', quantity: 1 })}
        >
          Add Item
        </button>

        {errors.items && (
          <span role="alert">{errors.items.message}</span>
        )}
      </fieldset>

      {/* Shipping */}
      <fieldset>
        <legend>Shipping</legend>
        <select {...register('shippingMethod')}>
          <option value="standard">Standard (5-7 days)</option>
          <option value="express">Express (2-3 days)</option>
          <option value="overnight">Overnight</option>
        </select>
      </fieldset>

      {/* Gift options */}
      <fieldset>
        <legend>Gift Options</legend>
        <label>
          <input type="checkbox" {...register('giftWrap')} />
          Gift wrap this order
        </label>

        {giftWrap && (
          <div>
            <label htmlFor="giftMessage">Gift Message</label>
            <textarea id="giftMessage" {...register('giftMessage')} />
            {errors.giftMessage && (
              <span role="alert">{errors.giftMessage.message}</span>
            )}
          </div>
        )}
      </fieldset>

      <button type="submit">Place Order</button>
    </form>
  );
}
```

### Custom Input Components with React Hook Form

```tsx
import { useForm, Controller, useFormContext, FormProvider } from 'react-hook-form';
import { forwardRef } from 'react';

// Reusable input component
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

// Select component with Controller
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
            <option value="">Select an option</option>
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

// Usage with FormProvider
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
        <TextInput name="username" label="Username" />
        <TextInput name="email" label="Email" type="email" />
        <TextInput name="password" label="Password" type="password" />
        <SelectInput
          name="role"
          label="Role"
          options={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' }
          ]}
        />
        <button type="submit">Register</button>
      </form>
    </FormProvider>
  );
}
```

## Error Handling and Display

### Error Message Strategies

```tsx
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';

// Animated error messages
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

// Error summary component
function ErrorSummary({ errors }) {
  const errorList = Object.entries(errors);

  if (errorList.length === 0) return null;

  return (
    <div role="alert" aria-labelledby="error-summary-title" className="error-summary">
      <h2 id="error-summary-title">Please fix the following errors:</h2>
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

// Toast notifications for form errors
function useFormErrorToast() {
  const showToast = useToast();

  return (errors: FieldErrors) => {
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      showToast({
        type: 'error',
        message: `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} in the form`,
        duration: 5000
      });
    }
  };
}
```

### Server-Side Error Handling

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

        // Handle field-specific errors
        if (errorData.errors) {
          errorData.errors.forEach((err: ApiError) => {
            setError(err.field as any, {
              type: 'server',
              message: err.message
            });
          });
        }

        // Handle general errors
        if (errorData.message) {
          setServerErrors([{ field: 'general', message: errorData.message }]);
        }

        return;
      }

      // Success handling
      const result = await response.json();
      console.log('Registration successful:', result);
    } catch (error) {
      setServerErrors([
        { field: 'general', message: 'An unexpected error occurred. Please try again.' }
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

      {/* Form fields */}
      <input {...register('email')} />
      {errors.email && <span role="alert">{errors.email.message}</span>}

      <button type="submit">Register</button>
    </form>
  );
}
```

## Accessibility in Form Validation

### ARIA Attributes and Labels

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
        {required && <span className="sr-only"> (required)</span>}
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
          <span className="sr-only">Error: </span>
          {error.message}
        </p>
      )}
    </div>
  );
}

// Screen reader only class
// .sr-only { position: absolute; width: 1px; height: 1px; padding: 0;
//            margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0);
//            white-space: nowrap; border: 0; }
```

### Focus Management

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

  // Focus first error field on submission
  useEffect(() => {
    const errorFields = Object.keys(errors);
    if (errorFields.length > 0) {
      // Focus error summary for screen readers
      errorSummaryRef.current?.focus();

      // Or focus first error field
      const firstErrorField = formRef.current?.querySelector(
        `[name="${errorFields[0]}"]`
      ) as HTMLElement;
      firstErrorField?.focus();
    }
  }, [errors]);

  const onSubmit = (data: FormData) => {
    console.log('Submitted:', data);
  };

  const onError = () => {
    // Focus will be handled by useEffect
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
          <h2 id="error-heading">There were errors with your submission</h2>
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
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Keyboard Navigation

```tsx
function AccessibleForm() {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Allow Enter to submit only when focused on submit button
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
      {/* Form fields with proper tab order */}
      <input tabIndex={0} name="firstName" />
      <input tabIndex={0} name="lastName" />
      <input tabIndex={0} name="email" type="email" />
      <button tabIndex={0} type="submit">Submit</button>
    </form>
  );
}
```

## Real-Time Validation Patterns

### Debounced Validation

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
    mode: 'onChange' // Validate on change
  });

  // Debounced async username check
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
        <label htmlFor="username">Username</label>
        <div className="input-with-status">
          <input
            id="username"
            {...register('username', {
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters'
              }
            })}
            aria-describedby="username-status"
          />
          <span id="username-status" aria-live="polite">
            {checking && <span className="checking">Checking...</span>}
            {!checking && usernameAvailable === true && (
              <span className="available">Available</span>
            )}
            {!checking && usernameAvailable === false && (
              <span className="taken">Username taken</span>
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

### Progressive Validation

```tsx
import { useForm } from 'react-hook-form';

function ProgressiveValidationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, touchedFields },
    trigger
  } = useForm({
    mode: 'onTouched', // Validate after field is touched
    reValidateMode: 'onChange' // Re-validate on change after touched
  });

  // Custom validation trigger on blur
  const handleBlur = async (fieldName: string) => {
    await trigger(fieldName);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email format'
            }
          })}
          onBlur={() => handleBlur('email')}
        />
        {/* Only show error after field has been touched */}
        {touchedFields.email && errors.email && (
          <span role="alert">{errors.email.message}</span>
        )}
      </div>

      <div>
        <input
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            }
          })}
          onBlur={() => handleBlur('password')}
        />
        {touchedFields.password && errors.password && (
          <span role="alert">{errors.password.message}</span>
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Password Strength Indicator

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
    feedback.push('Use at least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
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
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        {...register('password', {
          required: 'Password is required',
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

## Multi-Step Form Validation

### Wizard Form Pattern

```tsx
import { useState } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schemas for each step
const step1Schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email')
});

const step2Schema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code')
});

const step3Schema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Invalid card number'),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV')
});

// Combined schema
const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type FormData = z.infer<typeof fullSchema>;

const steps = [
  { schema: step1Schema, title: 'Personal Information' },
  { schema: step2Schema, title: 'Shipping Address' },
  { schema: step3Schema, title: 'Payment Details' }
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
    console.log('Form submitted:', data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Progress indicator */}
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

        {/* Step content */}
        <div className="step-content">
          {currentStep === 0 && <Step1 />}
          {currentStep === 1 && <Step2 />}
          {currentStep === 2 && <Step3 />}
        </div>

        {/* Navigation */}
        <div className="wizard-nav">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </button>

          {currentStep < steps.length - 1 ? (
            <button type="button" onClick={nextStep}>
              Next
            </button>
          ) : (
            <button type="submit">Submit</button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

// Step components
function Step1() {
  const { register, formState: { errors } } = useFormContext<FormData>();

  return (
    <div>
      <h2>Personal Information</h2>
      <div>
        <label htmlFor="firstName">First Name</label>
        <input id="firstName" {...register('firstName')} />
        {errors.firstName && <span role="alert">{errors.firstName.message}</span>}
      </div>
      <div>
        <label htmlFor="lastName">Last Name</label>
        <input id="lastName" {...register('lastName')} />
        {errors.lastName && <span role="alert">{errors.lastName.message}</span>}
      </div>
      <div>
        <label htmlFor="email">Email</label>
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
      <h2>Shipping Address</h2>
      <div>
        <label htmlFor="address">Street Address</label>
        <input id="address" {...register('address')} />
        {errors.address && <span role="alert">{errors.address.message}</span>}
      </div>
      <div>
        <label htmlFor="city">City</label>
        <input id="city" {...register('city')} />
        {errors.city && <span role="alert">{errors.city.message}</span>}
      </div>
      <div>
        <label htmlFor="zipCode">Zip Code</label>
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
      <h2>Payment Details</h2>
      <div>
        <label htmlFor="cardNumber">Card Number</label>
        <input id="cardNumber" {...register('cardNumber')} />
        {errors.cardNumber && <span role="alert">{errors.cardNumber.message}</span>}
      </div>
      <div>
        <label htmlFor="expiryDate">Expiry Date</label>
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

## Testing Form Validation

### Unit Testing Validation Logic

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short')
});

describe('User validation schema', () => {
  it('should accept valid data', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = userSchema.safeParse({
      email: 'invalid-email',
      password: 'password123'
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid email');
    }
  });

  it('should reject short password', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      password: 'short'
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password too short');
    }
  });
});
```

### Integration Testing with React Testing Library

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('should display validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should display error for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('should clear errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    // Trigger validation error
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    // Start typing to clear error
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');

    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });
  });
});
```

## Interview Questions

### Common Questions and Answers

**Q1: What is the difference between client-side and server-side validation?**

```
Client-side validation:
- Runs in the browser before form submission
- Provides instant feedback to users
- Improves user experience
- Can be bypassed (security risk if used alone)

Server-side validation:
- Runs on the server after form submission
- Cannot be bypassed by users
- Essential for security
- Provides final data integrity check

Best practice: Always use both. Client-side for UX, server-side for security.
```

**Q2: How do you handle async validation (e.g., checking username availability)?**

```typescript
// Using Zod
const usernameSchema = z.string().refine(
  async (username) => {
    const response = await checkUsernameAvailability(username);
    return response.available;
  },
  { message: 'Username is already taken' }
);

// Using React Hook Form
const { setError, clearErrors } = useForm();

const checkUsername = debounce(async (username) => {
  const available = await checkUsernameAvailability(username);
  if (!available) {
    setError('username', { message: 'Username is already taken' });
  } else {
    clearErrors('username');
  }
}, 500);
```

**Q3: How do you make form validation accessible?**

```tsx
// Key accessibility practices:
<div>
  {/* 1. Associate labels with inputs */}
  <label htmlFor="email">Email</label>

  {/* 2. Use aria-invalid for invalid state */}
  <input
    id="email"
    aria-invalid={error ? 'true' : 'false'}

    {/* 3. Connect error message with aria-describedby */}
    aria-describedby={error ? 'email-error' : undefined}

    {/* 4. Mark required fields */}
    aria-required="true"
  />

  {/* 5. Use role="alert" for error messages */}
  {error && (
    <span id="email-error" role="alert">
      {error.message}
    </span>
  )}
</div>
```

**Q4: When should you use Zod vs Yup?**

```
Choose Zod when:
- TypeScript is a priority
- You need excellent type inference
- You prefer a more modern API
- Bundle size matters

Choose Yup when:
- You need mature ecosystem support
- You're already familiar with it
- You need extensive conditional validation
- You prefer method chaining syntax
```

**Q5: How do you implement real-time validation without performance issues?**

```typescript
// Use debouncing for expensive validations
const debouncedValidate = useMemo(
  () => debounce((value) => validateAsync(value), 300),
  []
);

// Use mode configuration in React Hook Form
useForm({
  mode: 'onTouched',      // Validate on blur first
  reValidateMode: 'onChange' // Then on every change
});

// Avoid validating on every keystroke for complex rules
// Instead, validate on blur for complex fields
```

## Summary

Form validation is a fundamental skill for frontend developers. This guide covered:

1. **Native HTML5 Validation**: Quick setup with built-in browser support
2. **JavaScript Fundamentals**: Building custom validation logic
3. **Schema Validation**: Type-safe validation with Zod and Yup
4. **React Hook Form**: Performant form management with validation integration
5. **Error Handling**: User-friendly error display strategies
6. **Accessibility**: Making forms usable for everyone
7. **Real-Time Validation**: Immediate feedback without performance issues
8. **Testing**: Ensuring validation logic works correctly

Key takeaways:

- Always validate on both client and server
- Use schema validation for type safety and consistency
- Prioritize accessibility in error handling
- Debounce expensive validations
- Test validation logic thoroughly
- Provide clear, actionable error messages

By following these best practices, you can create forms that are secure, accessible, and provide an excellent user experience.

## Further Reading

### Official Documentation

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Yup Documentation](https://github.com/jquense/yup)
- [MDN: Client-side Form Validation](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)

### Related Topics

- **TypeScript**: For type-safe form handling
- **Accessibility (WCAG)**: For inclusive form design
- **Testing Library**: For testing form interactions
- **State Management**: For complex form state scenarios
