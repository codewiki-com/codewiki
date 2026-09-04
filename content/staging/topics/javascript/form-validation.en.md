---
title: JavaScript Form Validation and Constraint Validation API
description: Comprehensive guide to form validation in JavaScript using HTML5 Constraint Validation API and custom validation techniques
track: javascript
section: browser
difficulty: intermediate
tags:
  - form validation
  - constraint validation API
  - HTML5
  - user input
  - data validation
status: imported
origin: old/src/content/docs/javascript/form-validation.en.md
divergence: 0.283
issues:
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: DOM
  order: 15
  lastUpdated: 2026-01-07
---

Form validation is one of the most critical aspects of web application development. It ensures data integrity, improves user experience, and protects against invalid or malicious input. Modern JavaScript provides powerful built-in validation mechanisms through the HTML5 Constraint Validation API, while also supporting custom validation logic for complex requirements. This comprehensive guide explores both native HTML5 validation and programmatic approaches to form validation in JavaScript.

---

## Concept Explanation

### What is Form Validation?

Form validation is the process of checking whether user-submitted data meets specified requirements and constraints before processing. There are three primary levels of form validation:

1. **Client-side Validation**: Performed in the browser using HTML5 attributes and JavaScript
2. **Server-side Validation**: Performed on the server (mandatory for security)
3. **Real-time Validation**: Provides immediate feedback as users interact with forms

### The Constraint Validation API

The Constraint Validation API is a W3C standard that provides a comprehensive mechanism for validating form data. It combines:

- **HTML5 validation attributes** (`required`, `type`, `pattern`, `min`, `max`, etc.)
- **Validation properties and methods** on form elements
- **Validation events** (`invalid`, `change`, `input`)
- **Custom validity states** for application-specific rules

The API allows developers to:
- Check validity status programmatically
- Define custom validation logic
- Access detailed information about validation failures
- Control error messages and styling
- Trigger validation at specific moments

### Browser Support and Fallbacks

The Constraint Validation API is supported in all modern browsers. For legacy browsers, JavaScript-based validation libraries or polyfills provide fallback mechanisms. However, server-side validation is always required regardless of client-side capabilities.

---

## Core Principles

### Always Validate on the Server

Client-side validation improves user experience, but server-side validation is essential for security:

```javascript
// Client-side validation (UX improvement)
const email = document.getElementById('email');
email.addEventListener('invalid', (e) => {
  e.preventDefault();
  email.classList.add('error');
});

// Server-side validation (SECURITY - mandatory)
app.post('/submit', (req, res) => {
  const { email, password } = req.body;

  // Always validate on server
  if (!isValidEmail(email) || !isValidPassword(password)) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  // Process valid data
});
```

**Why**: Users can bypass client-side validation, making server validation the only reliable security measure.

### Progressive Enhancement

Build validation with layers:

1. **HTML5 attributes** (works without JavaScript)
2. **JavaScript enhancement** (richer feedback)
3. **Server validation** (security and final check)

```html
<!-- Layer 1: HTML5 attributes work without JavaScript -->
<input
  type="email"
  required
  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
  placeholder="Enter your email"
/>

<!-- Layer 2: JavaScript enhances the experience -->
<script>
  const input = document.querySelector('input[type="email"]');
  input.addEventListener('blur', validateEmail); // Custom feedback
</script>
```

### Provide Clear, Actionable Feedback

Validation messages should be:
- **Specific**: State exactly what's wrong
- **Actionable**: Tell users how to fix it
- **Immediate**: Provide feedback at the right time
- **Non-intrusive**: Don't interrupt the user flow

```javascript
// Bad feedback
input.setCustomValidity('Invalid');

// Good feedback
input.setCustomValidity('Password must contain at least 8 characters, one uppercase letter, and one number');
```

### Use Semantic HTML

Leverage HTML5 input types for both validation and accessibility:

```html
<!-- Appropriate input types trigger native validation -->
<input type="email" placeholder="Email address" />
<input type="url" placeholder="Website URL" />
<input type="tel" placeholder="Phone number" />
<input type="date" />
<input type="number" min="0" max="120" />
<input type="password" />
<input type="checkbox" required /> <!-- Must be checked -->
```

---

## Key Points

### Essential Concepts

1. **Validity State Objects**: Each form element has a `validity` property containing detailed validation status
   - `valid`: Overall validity status
   - `valueMissing`: Required but empty
   - `typeMismatch`: Wrong input type
   - `patternMismatch`: Doesn't match regex pattern
   - `tooShort`, `tooLong`: Length constraints violated
   - `rangeUnderflow`, `rangeOverflow`: Numeric bounds violated
   - `stepMismatch`: Invalid step value
   - `customError`: Custom validation set via `setCustomValidity()`

2. **Validation Events**: Control when validation occurs
   - `input`: Fires as user types (ideal for real-time feedback)
   - `change`: Fires when user leaves field
   - `invalid`: Fires when validation fails
   - `submit`: Form submission attempt

3. **Validation Methods**: Programmatically control validation
   - `element.checkValidity()`: Returns true/false
   - `form.checkValidity()`: Validates all form controls
   - `element.setCustomValidity()`: Set custom error messages
   - `element.reportValidity()`: Check validity and show browser message

4. **Custom Validity**: Override default validation messages
   - Use `setCustomValidity()` to set custom messages
   - Set to empty string to clear custom validity
   - Works with `:invalid` and `:valid` CSS pseudo-classes

---

## Code Examples

### Basic HTML5 Validation

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    input:invalid {
      border-color: red;
      background-color: #ffe6e6;
    }

    input:valid {
      border-color: green;
    }

    .error-message {
      color: red;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      display: none;
    }

    input:invalid ~ .error-message {
      display: block;
    }
  </style>
</head>
<body>
  <form id="contactForm">
    <div class="form-group">
      <label for="email">Email:</label>
      <input
        id="email"
        type="email"
        required
        placeholder="user@example.com"
      />
      <span class="error-message">Please enter a valid email address</span>
    </div>

    <div class="form-group">
      <label for="age">Age:</label>
      <input
        id="age"
        type="number"
        min="0"
        max="120"
        required
      />
      <span class="error-message">Age must be between 0 and 120</span>
    </div>

    <button type="submit">Submit</button>
  </form>
</body>
</html>
```

### Accessing Validity States

```javascript
const emailInput = document.getElementById('email');

// Check specific validity states
function validateEmail(input) {
  const validity = input.validity;

  if (validity.valueMissing) {
    return 'Email is required';
  } else if (validity.typeMismatch) {
    return 'Please enter a valid email address';
  } else if (validity.valid) {
    return null; // No error
  }
}

// Use in event listener
emailInput.addEventListener('blur', () => {
  const error = validateEmail(emailInput);
  displayErrorMessage(emailInput, error);
});

function displayErrorMessage(input, message) {
  const errorEl = input.nextElementSibling;
  if (errorEl && errorEl.classList.contains('error-message')) {
    if (message) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    } else {
      errorEl.style.display = 'none';
    }
  }
}
```

### Custom Validation with setCustomValidity()

```javascript
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');

// Password strength validation
function validatePasswordStrength(password) {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasMinLength = password.length >= 8;

  return hasUpperCase && hasLowerCase && hasNumbers && hasMinLength;
}

passwordInput.addEventListener('input', () => {
  const password = passwordInput.value;

  if (!validatePasswordStrength(password)) {
    passwordInput.setCustomValidity(
      'Password must contain at least 8 characters, ' +
      'one uppercase letter, one lowercase letter, and one number'
    );
  } else {
    passwordInput.setCustomValidity('');
  }

  // Also validate confirm password if it has a value
  if (confirmInput.value) {
    validatePasswordMatch();
  }
});

// Password matching validation
function validatePasswordMatch() {
  if (passwordInput.value !== confirmInput.value) {
    confirmInput.setCustomValidity('Passwords do not match');
  } else {
    confirmInput.setCustomValidity('');
  }
}

confirmInput.addEventListener('input', validatePasswordMatch);
```

### Complete Form Validation Class

```javascript
class FormValidator {
  constructor(formElement) {
    this.form = formElement;
    this.errors = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Real-time validation on input
    this.form.addEventListener('input', (e) => {
      if (e.target.form === this.form) {
        this.validateField(e.target);
      }
    });

    // Final validation on submit
    this.form.addEventListener('submit', (e) => {
      if (!this.validateForm()) {
        e.preventDefault();
        this.showErrors();
      }
    });
  }

  validateField(field) {
    const rules = this.getRulesForField(field);
    const value = field.value.trim();

    // Clear previous errors for this field
    this.errors.delete(field.name);

    // Run validation rules
    for (const rule of rules) {
      const error = this.checkRule(value, rule, field);
      if (error) {
        this.errors.set(field.name, error);
        this.markFieldInvalid(field, error);
        return;
      }
    }

    this.markFieldValid(field);
  }

  validateForm() {
    const fields = this.form.querySelectorAll('input, textarea, select');

    for (const field of fields) {
      this.validateField(field);
    }

    return this.errors.size === 0;
  }

  getRulesForField(field) {
    // Define custom validation rules
    const rules = [];

    if (field.hasAttribute('required')) {
      rules.push({ type: 'required' });
    }

    if (field.type === 'email') {
      rules.push({ type: 'email' });
    }

    if (field.hasAttribute('data-validate')) {
      rules.push({
        type: field.getAttribute('data-validate')
      });
    }

    return rules;
  }

  checkRule(value, rule, field) {
    switch (rule.type) {
      case 'required':
        return value === '' ? 'This field is required' : null;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Invalid email address' : null;

      case 'password':
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNum = /\d/.test(value);
        const hasMinLen = value.length >= 8;

        if (!hasMinLen) return 'Password must be at least 8 characters';
        if (!hasUpper) return 'Password must contain an uppercase letter';
        if (!hasLower) return 'Password must contain a lowercase letter';
        if (!hasNum) return 'Password must contain a number';
        return null;

      case 'phone':
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        return !phoneRegex.test(value) ? 'Invalid phone number' : null;

      default:
        return null;
    }
  }

  markFieldInvalid(field, errorMessage) {
    field.classList.remove('valid');
    field.classList.add('invalid');

    const errorEl = this.getErrorElement(field);
    if (errorEl) {
      errorEl.textContent = errorMessage;
      errorEl.style.display = 'block';
    }
  }

  markFieldValid(field) {
    field.classList.remove('invalid');
    field.classList.add('valid');

    const errorEl = this.getErrorElement(field);
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  getErrorElement(field) {
    // Look for next sibling with error class
    let el = field.nextElementSibling;
    while (el) {
      if (el.classList.contains('error-message')) {
        return el;
      }
      el = el.nextElementSibling;
    }
    return null;
  }

  showErrors() {
    const errorSummary = document.getElementById('errorSummary');
    if (!errorSummary) return;

    const errorList = Array.from(this.errors.values());
    const listItems = errorList
      .map(err => `<li>${err}</li>`)
      .join('');
    const errorHTML = `<h3>Please correct the following errors:</h3><ul>${listItems}</ul>`;

    // Use textContent to avoid XSS, then create elements
    const tempDiv = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = 'Please correct the following errors:';

    const list = document.createElement('ul');
    errorList.forEach(err => {
      const item = document.createElement('li');
      item.textContent = err;
      list.appendChild(item);
    });

    errorSummary.textContent = '';
    errorSummary.appendChild(heading);
    errorSummary.appendChild(list);
    errorSummary.style.display = 'block';
    errorSummary.scrollIntoView({ behavior: 'smooth' });
  }
}

// Usage
const form = document.getElementById('myForm');
const validator = new FormValidator(form);
```

### Real-time Validation with Debouncing

```javascript
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const usernameInput = document.getElementById('username');
const usernameStatus = document.getElementById('usernameStatus');

// Async validation (e.g., check if username is available)
async function checkUsernameAvailability(username) {
  if (username.length < 3) {
    usernameInput.setCustomValidity('Username must be at least 3 characters');
    return;
  }

  try {
    usernameStatus.textContent = 'Checking availability...';

    const response = await fetch(`/api/check-username?username=${username}`);
    const data = await response.json();

    if (data.available) {
      usernameInput.setCustomValidity('');
      usernameStatus.textContent = '✓ Username is available';
      usernameStatus.className = 'available';
    } else {
      usernameInput.setCustomValidity('This username is already taken');
      usernameStatus.textContent = '✗ Username is taken';
      usernameStatus.className = 'taken';
    }
  } catch (error) {
    console.error('Error checking username:', error);
    usernameStatus.textContent = 'Error checking availability';
  }
}

// Debounce the async validation
const debouncedCheck = debounce(checkUsernameAvailability, 500);

usernameInput.addEventListener('input', (e) => {
  debouncedCheck(e.target.value);
});
```

### Pattern Validation

```javascript
const urlInput = document.getElementById('website');

// URL pattern validation
const urlPattern =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

urlInput.addEventListener('blur', () => {
  const value = urlInput.value.trim();

  if (value && !urlPattern.test(value)) {
    urlInput.setCustomValidity('Please enter a valid URL');
  } else {
    urlInput.setCustomValidity('');
  }
});

// Or use pattern attribute
// <input type="url" pattern="https?://.+" required />
```

---

## Best Practices

### Validate Early and Often

```javascript
// Good: Validate as users interact with the form
form.addEventListener('input', (e) => {
  if (e.target.tagName === 'INPUT') {
    validateField(e.target);
  }
});

// Good: Validate on blur for less disruptive feedback
form.addEventListener('blur', (e) => {
  validateField(e.target);
}, true);

// Less ideal: Only validate on submit (poor UX)
form.addEventListener('submit', (e) => {
  if (!form.checkValidity()) {
    e.preventDefault();
  }
});
```

### Provide Clear Error Messages

```javascript
// Bad
field.setCustomValidity('Invalid');

// Good - specific and actionable
field.setCustomValidity(
  'Email must be in format: name@domain.com'
);

// Better - context-aware
const getErrorMessage = (field, validity) => {
  if (validity.valueMissing) {
    return `${field.labels[0].textContent} is required`;
  }
  if (validity.typeMismatch) {
    return `Please enter a valid ${field.type}`;
  }
  if (validity.tooShort) {
    return `Must be at least ${field.minLength} characters`;
  }
  return 'Please correct this field';
};
```

### Use HTML5 Attributes

```html
<!-- Leverage built-in validation -->
<input
  type="email"
  required
  placeholder="user@example.com"
/>

<input
  type="password"
  required
  minlength="8"
  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
/>

<input
  type="number"
  min="0"
  max="100"
  step="1"
/>

<textarea required minlength="10" maxlength="500"></textarea>

<select required>
  <option value="">Select an option</option>
  <option value="a">Option A</option>
</select>
```

### Disable Submit Until Valid (Cautiously)

```javascript
// Enable/disable submit button based on form validity
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('change', () => {
  submitButton.disabled = !form.checkValidity();
});

// Initial state
submitButton.disabled = !form.checkValidity();

// Note: Still validate on submit for security
```

### Handle File Input Validation

```javascript
const fileInput = document.getElementById('fileUpload');
const maxSize = 5 * 1024 * 1024; // 5MB
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];

  if (!file) return;

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    fileInput.setCustomValidity('Only JPEG, PNG, and PDF files allowed');
    return;
  }

  // Validate file size
  if (file.size > maxSize) {
    fileInput.setCustomValidity('File size must not exceed 5MB');
    return;
  }

  fileInput.setCustomValidity('');
});
```

### Use aria Attributes for Accessibility

```html
<div class="form-group">
  <label for="email">Email Address</label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-describedby="emailHelp emailError"
  />
  <small id="emailHelp">We'll never share your email.</small>
  <span id="emailError" class="error-message" role="alert"></span>
</div>
```

---

## Common Pitfalls

### Forgetting Server-side Validation

```javascript
// WRONG: Relying only on client-side validation
document.getElementById('form').addEventListener('submit', (e) => {
  const form = e.target;
  if (form.checkValidity()) {
    // Send to server
    fetch('/submit', { method: 'POST', body: new FormData(form) });
  } else {
    e.preventDefault();
  }
});

// CORRECT: Server always validates
// Backend (Node.js example)
app.post('/submit', (req, res) => {
  const { email } = req.body;

  // Always validate - users can bypass client validation
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  // Continue with processing
});
```

### Ignoring Browser Compatibility

```javascript
// WRONG: Assuming all browsers support all features
const input = document.querySelector('input[type="date"]');

// CORRECT: Feature detection and fallback
if (input.type === 'date') {
  // Browser supports native date input
} else {
  // Fallback to custom date picker
  loadDatePickerLibrary();
}
```

### Poor UX with Immediate Validation

```javascript
// WRONG: Showing errors before user finishes typing
input.addEventListener('input', () => {
  validateField(input);
  showErrors(input); // Too aggressive
});

// CORRECT: Validate on blur or with debounce
input.addEventListener('blur', () => {
  validateField(input);
  showErrors(input);
});

// Or with debounce for real-time feedback
const debouncedValidate = debounce(() => {
  validateField(input);
  showErrors(input);
}, 300);

input.addEventListener('input', debouncedValidate);
```

### Unclear Error Messages

```javascript
// WRONG: Vague error messages
field.setCustomValidity('Invalid input');

// CORRECT: Specific, actionable messages
field.setCustomValidity(
  'Password must contain at least one number and one special character'
);
```

### Not Testing Edge Cases

```javascript
// Test these scenarios
const testCases = [
  '', // Empty string
  ' ', // Whitespace only
  null, // null value
  undefined, // undefined value
  '0', // Zero as string
  false, // Boolean false
  NaN, // Not a number
];

function robustValidate(value) {
  // Handle all edge cases
  if (value === null || value === undefined) {
    return false;
  }

  const trimmed = String(value).trim();

  if (trimmed === '') {
    return false;
  }

  // ... rest of validation
}
```

### Forgetting to Clear Custom Validity

```javascript
// WRONG: Custom validity persists
field.setCustomValidity('Error message');
// ... user fixes the input
// Error message still shows even though input is valid

// CORRECT: Clear custom validity when valid
if (isValid) {
  field.setCustomValidity(''); // Clear the error
} else {
  field.setCustomValidity('Error message');
}
```

---

## Performance Considerations

### Debounce Expensive Validations

```javascript
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Expensive async validation (e.g., database lookup)
async function checkEmailExists(email) {
  const response = await fetch(`/api/check-email?email=${email}`);
  return response.json();
}

const emailInput = document.getElementById('email');
const debouncedCheck = debounce(async (value) => {
  const exists = await checkEmailExists(value);
  if (exists) {
    emailInput.setCustomValidity('Email already registered');
  }
}, 500);

emailInput.addEventListener('input', (e) => {
  debouncedCheck(e.target.value);
});
```

### Cache Validation Results

```javascript
class CachedValidator {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async validate(value) {
    const cacheKey = `validation_${value}`;
    const cached = this.cache.get(cacheKey);

    // Return cached result if still fresh
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    // Fetch fresh result
    const result = await this.fetchValidation(value);
    this.cache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  }

  async fetchValidation(value) {
    // Perform validation
  }
}
```

### Batch Validation for Multiple Fields

```javascript
// WRONG: Validate each field separately
fields.forEach(field => {
  field.addEventListener('blur', () => validateField(field));
});

// BETTER: Batch validations
const pendingValidations = new Set();

fields.forEach(field => {
  field.addEventListener('blur', () => {
    pendingValidations.add(field);
    scheduleBatchValidation();
  });
});

function scheduleBatchValidation() {
  requestIdleCallback(() => {
    pendingValidations.forEach(field => validateField(field));
    pendingValidations.clear();
  });
}
```

### Use requestAnimationFrame for DOM Updates

```javascript
// WRONG: Multiple DOM updates blocking render
input.addEventListener('input', (e) => {
  validateField(e.target);
  updateErrorMessage(e.target);
  highlightField(e.target);
});

// BETTER: Batch DOM updates
input.addEventListener('input', (e) => {
  requestAnimationFrame(() => {
    validateField(e.target);
    updateErrorMessage(e.target);
    highlightField(e.target);
  });
});
```

---

## Real-world Scenarios

### Scenario 1: E-commerce Checkout Form

```javascript
class CheckoutForm {
  constructor(formElement) {
    this.form = formElement;
    this.setupValidation();
  }

  setupValidation() {
    // Email validation
    const emailInput = this.form.querySelector('#email');
    emailInput.addEventListener('blur', () => {
      this.validateEmail(emailInput);
    });

    // Address validation
    const addressInputs = this.form.querySelectorAll('.address-input');
    addressInputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateAddress(input);
      });
    });

    // Credit card validation
    const cardInput = this.form.querySelector('#cardNumber');
    cardInput.addEventListener('input', (e) => {
      this.formatCardNumber(e.target);
    });
    cardInput.addEventListener('blur', () => {
      this.validateCardNumber(cardInput);
    });

    // Form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.processCheckout();
    });
  }

  validateEmail(input) {
    const value = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      input.setCustomValidity('Please enter a valid email address');
    } else {
      input.setCustomValidity('');
    }
  }

  validateAddress(input) {
    if (input.value.trim().length < 5) {
      input.setCustomValidity('Please enter a valid address');
    } else {
      input.setCustomValidity('');
    }
  }

  formatCardNumber(input) {
    const value = input.value.replace(/\s/g, '');
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
    input.value = formatted;
  }

  validateCardNumber(input) {
    const value = input.value.replace(/\s/g, '');

    if (!/^\d{13,19}$/.test(value)) {
      input.setCustomValidity('Invalid card number');
      return;
    }

    // Luhn algorithm
    if (!this.luhnCheck(value)) {
      input.setCustomValidity('Invalid card number');
      return;
    }

    input.setCustomValidity('');
  }

  luhnCheck(cardNumber) {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  processCheckout() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    // Submit to server
    const formData = new FormData(this.form);
    fetch('/api/checkout', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/success';
      }
    });
  }
}

// Initialize
const checkoutForm = new CheckoutForm(document.getElementById('checkoutForm'));
```

### Scenario 2: Registration Form with Async Validation

```javascript
class RegistrationForm {
  constructor(formElement) {
    this.form = formElement;
    this.validationCache = new Map();
    this.setupValidation();
  }

  setupValidation() {
    const usernameInput = this.form.querySelector('#username');
    const emailInput = this.form.querySelector('#email');
    const passwordInput = this.form.querySelector('#password');
    const confirmInput = this.form.querySelector('#confirmPassword');

    // Username availability check
    usernameInput.addEventListener('input',
      this.debounce((e) => {
        this.checkUsernameAvailability(e.target);
      }, 500)
    );

    // Email availability check
    emailInput.addEventListener('input',
      this.debounce((e) => {
        this.checkEmailAvailability(e.target);
      }, 500)
    );

    // Password strength
    passwordInput.addEventListener('input', (e) => {
      this.validatePasswordStrength(e.target);
    });

    // Password confirmation
    confirmInput.addEventListener('input', () => {
      this.validatePasswordMatch(passwordInput, confirmInput);
    });

    // Form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.registerUser();
    });
  }

  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  async checkUsernameAvailability(input) {
    const username = input.value.trim();

    if (username.length < 3) {
      input.setCustomValidity('Username must be at least 3 characters');
      return;
    }

    // Check cache first
    if (this.validationCache.has(`username_${username}`)) {
      const result = this.validationCache.get(`username_${username}`);
      input.setCustomValidity(result.message);
      return;
    }

    try {
      const response = await fetch(
        `/api/check-username?username=${encodeURIComponent(username)}`
      );
      const data = await response.json();

      const message = data.available ? '' : 'Username is already taken';
      input.setCustomValidity(message);

      // Cache result for 5 minutes
      this.validationCache.set(`username_${username}`, {
        message,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error checking username:', error);
      input.setCustomValidity('Error checking availability');
    }
  }

  async checkEmailAvailability(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      input.setCustomValidity('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch(
        `/api/check-email?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();

      input.setCustomValidity(
        data.available ? '' : 'Email is already registered'
      );
    } catch (error) {
      console.error('Error checking email:', error);
      input.setCustomValidity('Error checking availability');
    }
  }

  validatePasswordStrength(input) {
    const password = input.value;
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };

    const allMet = Object.values(requirements).every(req => req);

    if (!allMet && password.length > 0) {
      const missing = [];
      if (!requirements.length) missing.push('8+ characters');
      if (!requirements.uppercase) missing.push('uppercase letter');
      if (!requirements.lowercase) missing.push('lowercase letter');
      if (!requirements.number) missing.push('number');
      if (!requirements.special) missing.push('special character');

      input.setCustomValidity(
        `Password must contain: ${missing.join(', ')}`
      );
    } else {
      input.setCustomValidity('');
    }

    // Update visual indicator
    this.updatePasswordStrengthMeter(requirements);
  }

  updatePasswordStrengthMeter(requirements) {
    const meter = this.form.querySelector('#passwordStrength');
    if (!meter) return;

    const metCount = Object.values(requirements).filter(Boolean).length;
    const strength = Math.round((metCount / Object.keys(requirements).length) * 100);

    meter.style.width = strength + '%';
    meter.className = 'strength-bar ' + (
      strength < 40 ? 'weak' :
      strength < 70 ? 'fair' :
      strength < 100 ? 'good' :
      'strong'
    );
  }

  validatePasswordMatch(passwordInput, confirmInput) {
    if (passwordInput.value !== confirmInput.value) {
      confirmInput.setCustomValidity('Passwords do not match');
    } else {
      confirmInput.setCustomValidity('');
    }
  }

  async registerUser() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    const formData = new FormData(this.form);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = '/login?registered=true';
      } else {
        alert('Registration failed: ' + data.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration');
    }
  }
}

// Initialize
const registrationForm = new RegistrationForm(
  document.getElementById('registrationForm')
);
```

### Scenario 3: Dynamic Form with Conditional Validation

```javascript
class ConditionalForm {
  constructor(formElement) {
    this.form = formElement;
    this.setupValidation();
  }

  setupValidation() {
    // Handle conditional fields
    const userTypeSelect = this.form.querySelector('#userType');

    userTypeSelect.addEventListener('change', (e) => {
      this.updateConditionalFields(e.target.value);
    });

    // Initial setup
    this.updateConditionalFields(userTypeSelect.value);
  }

  updateConditionalFields(userType) {
    const businessFields = this.form.querySelectorAll('[data-require="business"]');
    const studentFields = this.form.querySelectorAll('[data-require="student"]');

    businessFields.forEach(field => {
      this.setFieldRequired(field, userType === 'business');
    });

    studentFields.forEach(field => {
      this.setFieldRequired(field, userType === 'student');
    });
  }

  setFieldRequired(container, isRequired) {
    const input = container.querySelector('input, textarea, select');

    if (!input) return;

    if (isRequired) {
      input.setAttribute('required', '');
      container.classList.add('required-field');
    } else {
      input.removeAttribute('required');
      input.setCustomValidity('');
      input.classList.remove('invalid');
      container.classList.remove('required-field');
    }
  }
}
```

---

## Interview Points

### Q1: What is the Constraint Validation API?

**Answer**: The Constraint Validation API is a W3C standard that provides built-in form validation in HTML5. It includes:
- HTML5 validation attributes (`required`, `type`, `pattern`, `min`, `max`)
- `validity` property with specific error states
- Methods like `checkValidity()`, `reportValidity()`, and `setCustomValidity()`
- CSS pseudo-classes (`:valid`, `:invalid`)
- Validation events (`invalid`, `input`, `change`)

It enables developers to validate form data both declaratively (via HTML attributes) and programmatically (via JavaScript).

### Q2: Explain the difference between client-side and server-side validation

**Answer**:
- **Client-side validation**: Performed in the browser using HTML5 and JavaScript. Provides immediate feedback but can be bypassed.
- **Server-side validation**: Performed on the server. Essential for security since clients can disable JavaScript or modify code.

Both are necessary: client-side improves UX, server-side ensures security.

### Q3: What are the validity states and how do you access them?

**Answer**: The `validity` object contains boolean properties for each validation type:
```javascript
const input = document.querySelector('input');
const validity = input.validity;

// Properties:
validity.valid // Overall validity
validity.valueMissing // Required but empty
validity.typeMismatch // Wrong type
validity.patternMismatch // Doesn't match pattern
validity.tooShort / tooLong // Length constraint
validity.rangeUnderflow / rangeOverflow // Numeric bounds
validity.stepMismatch // Invalid step
validity.customError // Custom validation error
```

### Q4: How would you implement password strength validation?

**Answer**:
```javascript
function validatePasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };

  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score, strength: score / 5 };
}
```

### Q5: What's the difference between `checkValidity()` and `reportValidity()`?

**Answer**:
- `checkValidity()`: Returns true/false, doesn't display validation messages
- `reportValidity()`: Returns true/false AND shows the browser's validation message

Use `checkValidity()` for programmatic validation, `reportValidity()` to show browser's default UI.

### Q6: How would you implement async validation (e.g., checking if email exists)?

**Answer**:
```javascript
const debouncedCheck = debounce(async (email) => {
  const response = await fetch(`/api/check-email?email=${email}`);
  const data = await response.json();

  input.setCustomValidity(
    data.available ? '' : 'Email already registered'
  );
}, 500);

input.addEventListener('input', (e) => {
  debouncedCheck(e.target.value);
});
```

Use debouncing to reduce server requests and improve performance.

### Q7: Why is server-side validation mandatory even with client-side validation?

**Answer**: Users can:
- Disable JavaScript
- Modify JavaScript in DevTools
- Send raw HTTP requests
- Use tools that bypass the browser

Therefore, server-side validation is the only truly reliable security measure.

### Q8: How would you validate a file upload?

**Answer**:
```javascript
const fileInput = document.querySelector('input[type="file"]');

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png'];

  if (!allowedTypes.includes(file.type)) {
    fileInput.setCustomValidity('Invalid file type');
  } else if (file.size > maxSize) {
    fileInput.setCustomValidity('File too large');
  } else {
    fileInput.setCustomValidity('');
  }
});
```

---

## Further Reading

### Official Documentation
- [MDN: Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation)
- [HTML Standard: Form Validation](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html)
- [W3C: HTML5 Input Types](https://www.w3.org/TR/html5/sec-forms.html)

### Validation Libraries
- [Parsley.js](http://parsleyjs.org/): JavaScript form validation
- [Joi](https://joi.dev/): Schema validation
- [Yup](https://github.com/jquense/yup): Schema validation for JavaScript
- [Zod](https://zod.dev/): TypeScript-first schema validation

### Related Concepts
- OWASP Form Validation
- Input Sanitization
- Regular Expressions
- Accessibility (ARIA) for Form Validation
- Progressive Enhancement

### Best Practices Resources
- [OWASP: Input Validation](https://owasp.org/www-community/attacks/xss/)
- [Mozilla: HTML Forms](https://developer.mozilla.org/en-US/docs/Learn/Forms)
- [Web Fundamentals: Form Validation](https://web.dev/bfcache/)

---

## Summary

Form validation is a critical aspect of web development that requires both client-side and server-side implementation. The HTML5 Constraint Validation API provides powerful built-in tools for validating form data, while JavaScript enables custom, complex validation logic. Key takeaways include:

1. **Always validate on the server** - Client-side validation can always be bypassed
2. **Provide clear feedback** - Help users understand what went wrong
3. **Use progressive enhancement** - Build from HTML5 attributes up to JavaScript
4. **Validate at appropriate times** - Balance between responsiveness and user experience
5. **Cache expensive validations** - Debounce async operations to improve performance
6. **Test edge cases thoroughly** - Handle null, undefined, empty strings, and other edge cases
7. **Consider accessibility** - Use ARIA attributes and semantic HTML
8. **Leverage native validation** - Use HTML5 input types and attributes before custom code

With these practices and techniques, you can build robust, user-friendly forms that provide excellent validation and user experience across all browsers and devices.
