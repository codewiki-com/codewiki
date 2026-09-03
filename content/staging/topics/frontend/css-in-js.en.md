---
title: CSS-in-JS Complete Guide
description: Deep dive into CSS-in-JS solutions including Styled Components, Emotion, Panda CSS, and more
track: frontend
section: html-css
difficulty: intermediate
tags:
  - CSS-in-JS
  - Styled Components
  - Emotion
  - Styling Solutions
status: imported
origin: old/src/content/docs/frontend/css-in-js.en.md
divergence: 0.201
issues: []
legacy:
  category: Frontend
  subcategory: CSS
  order: 26
  lastUpdated: 2026-01-07
---

CSS-in-JS is a styling approach where CSS is composed using JavaScript instead of defined in external files. This paradigm shift enables component-scoped styles, dynamic theming, and eliminates the traditional problems of CSS at scale like naming collisions and dead code elimination.

## Understanding CSS-in-JS

### What is CSS-in-JS?

CSS-in-JS refers to a pattern where CSS is written within JavaScript files, typically co-located with React or other component-based frameworks. Rather than maintaining separate stylesheet files, styles are defined programmatically and scoped to individual components.

```jsx
// Traditional CSS approach
// styles.css
// .button { background: blue; color: white; }

// CSS-in-JS approach
const Button = styled.button`
  background: blue;
  color: white;
`;
```

The core idea is that styles are treated as a first-class citizen of JavaScript, enabling:

1. **Automatic scoping**: Styles are scoped to components, eliminating global namespace pollution
2. **Dynamic styling**: Styles can change based on props, state, or theme
3. **Dead code elimination**: Unused styles are automatically removed
4. **Co-location**: Styles live alongside component logic for better maintainability

### Historical Context

CSS-in-JS emerged around 2014-2015, pioneered by libraries like Radium and later popularized by Styled Components (2016). The approach was born from frustrations with CSS at scale in large applications:

- **Global namespace**: CSS selectors are global, leading to naming conflicts
- **Specificity wars**: Competing stylesheets fighting for precedence
- **Dead code**: Difficulty tracking which styles are actually used
- **Dependencies**: No clear relationship between styles and components

Christopher Chedeau's famous talk "CSS in JS" at NationJS 2014 outlined seven problems with CSS at scale, sparking the movement that led to today's ecosystem of solutions.

### Runtime vs Zero-Runtime: The Fundamental Divide

The CSS-in-JS ecosystem is divided into two main categories based on when styles are processed:

#### Runtime CSS-in-JS

Runtime libraries generate and inject styles at runtime in the browser. Examples include Styled Components and Emotion.

```jsx
// Runtime: Styles are generated when the component renders
const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'gray'};
  padding: 10px 20px;
`;

// At runtime, this generates a unique class and injects CSS into <style> tags
```

**Advantages**:
- Full access to JavaScript runtime (props, state, context)
- Easier dynamic theming
- No build step configuration required

**Disadvantages**:
- Runtime performance overhead
- Increased JavaScript bundle size
- Potential Flash of Unstyled Content (FOUC)
- Hydration issues in SSR

#### Zero-Runtime (Compile-Time) CSS-in-JS

Zero-runtime libraries extract styles at build time, generating static CSS files. Examples include vanilla-extract, Linaria, and Panda CSS.

```typescript
// Zero-runtime: Styles are extracted at build time
// styles.css.ts (vanilla-extract)
import { style } from '@vanilla-extract/css';

export const button = style({
  background: 'blue',
  padding: '10px 20px'
});
// Generates: .button_abc123 { background: blue; padding: 10px 20px; }
```

**Advantages**:
- Zero runtime JavaScript overhead
- Better performance (static CSS)
- Compatible with React Server Components
- No hydration issues

**Disadvantages**:
- Limited dynamic styling capabilities
- Requires build configuration
- Learning curve for type-safe APIs

## Styled Components

Styled Components is one of the most popular CSS-in-JS libraries, known for its intuitive tagged template literal syntax and robust feature set.

### Installation and Setup

```bash
# npm
npm install styled-components

# yarn
yarn add styled-components

# For TypeScript support
npm install @types/styled-components --save-dev
```

### Basic Usage

```jsx
import styled from 'styled-components';

// Create a styled component
const Button = styled.button`
  background: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s ease;

  &:hover {
    background: #2980b9;
  }

  &:active {
    transform: scale(0.98);
  }
`;

// Usage
function App() {
  return <Button>Click Me</Button>;
}
```

### Props-Based Styling

One of Styled Components' most powerful features is the ability to adapt styles based on props:

```jsx
const Button = styled.button`
  background: ${props => props.$primary ? '#3498db' : '#95a5a6'};
  color: white;
  padding: ${props => props.$size === 'large' ? '15px 30px' : '10px 20px'};
  font-size: ${props => props.$size === 'large' ? '18px' : '14px'};
  border: none;
  border-radius: 4px;
  cursor: pointer;

  ${props => props.$outlined && `
    background: transparent;
    border: 2px solid ${props.$primary ? '#3498db' : '#95a5a6'};
    color: ${props.$primary ? '#3498db' : '#95a5a6'};
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Usage with transient props ($ prefix prevents prop forwarding to DOM)
<Button $primary>Primary Button</Button>
<Button $size="large">Large Button</Button>
<Button $primary $outlined>Outlined Primary</Button>
```

### Extending Styles

You can extend existing styled components to create variations:

```jsx
const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
`;

const PrimaryButton = styled(Button)`
  background: #3498db;
  color: white;

  &:hover {
    background: #2980b9;
  }
`;

const DangerButton = styled(Button)`
  background: #e74c3c;
  color: white;

  &:hover {
    background: #c0392b;
  }
`;

// Extending with different element
const LinkButton = styled(Button).attrs({ as: 'a' })`
  text-decoration: none;
  display: inline-block;
`;
```

### Theming

Styled Components provides a powerful theming system via the ThemeProvider:

```jsx
import { ThemeProvider, createGlobalStyle } from 'styled-components';

// Define themes
const lightTheme = {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#ffffff',
    text: '#333333',
    border: '#e0e0e0',
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px',
  },
  borderRadius: '4px',
};

const darkTheme = {
  colors: {
    primary: '#5dade2',
    secondary: '#58d68d',
    background: '#1a1a2e',
    text: '#eaeaea',
    border: '#2d2d44',
  },
  spacing: lightTheme.spacing,
  borderRadius: '4px',
};

// Global styles using theme
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
`;

// Components using theme
const Card = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius};
  padding: ${({ theme }) => theme.spacing.medium};
`;

const Button = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: ${({ theme }) => theme.spacing.small} ${({ theme }) => theme.spacing.medium};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
`;

// App with theme provider
function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <GlobalStyle />
      <Card>
        <Button onClick={() => setIsDark(!isDark)}>
          Toggle Theme
        </Button>
      </Card>
    </ThemeProvider>
  );
}
```

### Advanced Patterns

#### The css Helper

```jsx
import styled, { css } from 'styled-components';

// Reusable style fragments
const flexCenter = css`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const truncateText = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Card = styled.div`
  ${flexCenter}
  padding: 20px;
`;

const Title = styled.h3`
  ${truncateText}
  max-width: 200px;
`;

// Conditional styles with css helper
const buttonVariants = {
  primary: css`
    background: #3498db;
    color: white;
  `,
  secondary: css`
    background: #95a5a6;
    color: white;
  `,
  ghost: css`
    background: transparent;
    color: #333;
    border: 1px solid #ddd;
  `,
};

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  ${props => buttonVariants[props.$variant] || buttonVariants.primary}
`;
```

#### Attrs for Default Props

```jsx
const Input = styled.input.attrs(props => ({
  type: props.type || 'text',
  placeholder: props.placeholder || 'Enter value...',
}))`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
`;

const PasswordInput = styled(Input).attrs({
  type: 'password',
})``;
```

#### Animation Support

```jsx
import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
`;

const FadeInBox = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
`;
```

## Emotion

Emotion is a high-performance CSS-in-JS library that offers both a styled API similar to Styled Components and a more flexible css prop approach.

### Installation

```bash
# For the styled API (similar to styled-components)
npm install @emotion/styled @emotion/react

# For css prop only
npm install @emotion/react
```

### The css Prop Approach

Emotion's css prop provides a more flexible way to apply styles directly to elements:

```jsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

const buttonStyles = css`
  background: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #2980b9;
  }
`;

function App() {
  return (
    <button css={buttonStyles}>
      Click Me
    </button>
  );
}

// Inline styles with css prop
function DynamicButton({ primary }) {
  return (
    <button
      css={css`
        background: ${primary ? '#3498db' : '#95a5a6'};
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
      `}
    >
      Click Me
    </button>
  );
}
```

### The styled API

Emotion also provides a styled API nearly identical to Styled Components:

```jsx
import styled from '@emotion/styled';

const Button = styled.button`
  background: ${props => props.primary ? '#3498db' : '#95a5a6'};
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

// Object styles (alternative syntax)
const Card = styled.div({
  background: 'white',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
});

// Combining template literals and object styles
const FlexContainer = styled.div(
  {
    display: 'flex',
    alignItems: 'center',
  },
  props => ({
    justifyContent: props.center ? 'center' : 'flex-start',
    gap: props.gap || '10px',
  })
);
```

### Composition and Style Merging

Emotion excels at composing and merging styles:

```jsx
import { css } from '@emotion/react';

const baseButton = css`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
`;

const primaryButton = css`
  ${baseButton}
  background: #3498db;
  color: white;

  &:hover {
    background: #2980b9;
  }
`;

const largeButton = css`
  ${primaryButton}
  padding: 15px 30px;
  font-size: 18px;
`;

// Using cx for conditional composition
import { cx } from '@emotion/css';

function Button({ primary, large, className }) {
  return (
    <button
      className={cx(
        baseButton,
        primary && primaryButton,
        large && largeButton,
        className
      )}
    >
      Click Me
    </button>
  );
}
```

### Server-Side Rendering

Emotion has excellent SSR support:

```jsx
// For Next.js with App Router
// app/layout.tsx
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '@emotion/cache';

const cache = createEmotionCache({ key: 'css' });

export default function RootLayout({ children }) {
  return (
    <CacheProvider value={cache}>
      {children}
    </CacheProvider>
  );
}
```

## Panda CSS

Panda CSS is a modern, zero-runtime CSS-in-JS solution that generates atomic CSS at build time. It combines the developer experience of CSS-in-JS with the performance of traditional CSS.

### Installation and Setup

```bash
# Install Panda CSS
npm install -D @pandacss/dev

# Initialize configuration
npx panda init

# Generate the CSS
npx panda codegen
```

### Configuration

```javascript
// panda.config.ts
import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  // Where to look for CSS declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // The output directory for generated styles
  outdir: 'styled-system',

  // Theme customization
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: '#3498db' },
          secondary: { value: '#2ecc71' },
          danger: { value: '#e74c3c' },
        },
        fonts: {
          body: { value: 'Inter, sans-serif' },
          heading: { value: 'Poppins, sans-serif' },
        },
      },
      semanticTokens: {
        colors: {
          text: {
            value: {
              base: '{colors.gray.900}',
              _dark: '{colors.gray.100}',
            },
          },
          background: {
            value: {
              base: '{colors.white}',
              _dark: '{colors.gray.900}',
            },
          },
        },
      },
    },
  },

  // Patterns for common layouts
  patterns: {
    extend: {
      scrollable: {
        description: 'A container that allows for scrolling',
        properties: {
          direction: { type: 'enum', value: ['horizontal', 'vertical'] },
          hideScrollbar: { type: 'boolean' },
        },
        transform(props) {
          const { direction, hideScrollbar, ...rest } = props;
          return {
            overflow: 'auto',
            flexDirection: direction === 'horizontal' ? 'row' : 'column',
            scrollbarWidth: hideScrollbar ? 'none' : 'auto',
            ...rest,
          };
        },
      },
    },
  },
});
```

### Basic Usage with css Function

```jsx
import { css } from '../styled-system/css';

function Button({ variant = 'primary' }) {
  return (
    <button
      className={css({
        bg: variant === 'primary' ? 'primary' : 'secondary',
        color: 'white',
        px: '4',
        py: '2',
        borderRadius: 'md',
        cursor: 'pointer',
        transition: 'all 0.2s',
        _hover: {
          opacity: 0.9,
          transform: 'translateY(-1px)',
        },
        _active: {
          transform: 'translateY(0)',
        },
      })}
    >
      Click Me
    </button>
  );
}
```

### Recipes for Component Variants

Recipes are Panda's way of defining component variants with type safety:

```typescript
// button.recipe.ts
import { cva } from '../styled-system/css';

export const button = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'md',
    fontWeight: 'semibold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  variants: {
    variant: {
      solid: {
        bg: 'primary',
        color: 'white',
        _hover: { bg: 'primary/90' },
      },
      outline: {
        border: '2px solid',
        borderColor: 'primary',
        color: 'primary',
        bg: 'transparent',
        _hover: { bg: 'primary/10' },
      },
      ghost: {
        color: 'primary',
        bg: 'transparent',
        _hover: { bg: 'primary/10' },
      },
    },
    size: {
      sm: { px: '3', py: '1.5', fontSize: 'sm' },
      md: { px: '4', py: '2', fontSize: 'md' },
      lg: { px: '6', py: '3', fontSize: 'lg' },
    },
  },
  defaultVariants: {
    variant: 'solid',
    size: 'md',
  },
});

// Usage in component
import { button } from './button.recipe';

function Button({ variant, size, children }) {
  return (
    <button className={button({ variant, size })}>
      {children}
    </button>
  );
}

// TypeScript will infer correct prop types!
<Button variant="outline" size="lg">Large Outline</Button>
```

### Patterns for Layout

Panda provides built-in patterns for common layout needs:

```jsx
import { flex, grid, container, center } from '../styled-system/patterns';

function Layout() {
  return (
    <div className={container({ maxW: '7xl', px: '4' })}>
      <header className={flex({ justify: 'space-between', align: 'center', py: '4' })}>
        <Logo />
        <Navigation />
      </header>

      <main className={grid({ columns: { base: 1, md: 2, lg: 3 }, gap: '6' })}>
        {items.map(item => (
          <Card key={item.id} item={item} />
        ))}
      </main>

      <div className={center({ h: '64' })}>
        <LoadingSpinner />
      </div>
    </div>
  );
}
```

### JSX Style Props

Panda can also generate JSX components with style props:

```jsx
// Enable in panda.config.ts
// jsxFramework: 'react'

import { Box, Flex, Grid, styled } from '../styled-system/jsx';

function Card() {
  return (
    <Box
      bg="white"
      borderRadius="lg"
      p="6"
      shadow="md"
      _hover={{ shadow: 'lg' }}
    >
      <Flex direction="column" gap="4">
        <styled.h3 fontSize="xl" fontWeight="bold">
          Card Title
        </styled.h3>
        <styled.p color="gray.600">
          Card description goes here.
        </styled.p>
      </Flex>
    </Box>
  );
}
```

## vanilla-extract

vanilla-extract is a zero-runtime CSS-in-JS library with first-class TypeScript support. It generates static CSS at build time, making it ideal for performance-critical applications.

### Installation

```bash
npm install @vanilla-extract/css

# For bundler integration
npm install @vanilla-extract/vite-plugin  # Vite
npm install @vanilla-extract/webpack-plugin  # Webpack
npm install @vanilla-extract/next-plugin  # Next.js
```

### Vite Configuration

```javascript
// vite.config.ts
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default {
  plugins: [vanillaExtractPlugin()],
};
```

### Basic Styling

Styles are defined in `.css.ts` files:

```typescript
// button.css.ts
import { style, globalStyle } from '@vanilla-extract/css';

export const button = style({
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.2s ease',

  ':hover': {
    transform: 'translateY(-1px)',
  },

  ':active': {
    transform: 'translateY(0)',
  },

  // Media queries
  '@media': {
    '(min-width: 768px)': {
      fontSize: '16px',
    },
  },
});

export const primaryButton = style([
  button,
  {
    background: '#3498db',
    color: 'white',

    ':hover': {
      background: '#2980b9',
    },
  },
]);

// Global styles
globalStyle('html, body', {
  margin: 0,
  padding: 0,
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
});
```

### Using Styles in Components

```tsx
// Button.tsx
import { button, primaryButton } from './button.css';

export function Button({ primary, children }) {
  return (
    <button className={primary ? primaryButton : button}>
      {children}
    </button>
  );
}
```

### Theme Contracts and Variables

vanilla-extract provides powerful theming through CSS variables:

```typescript
// theme.css.ts
import { createTheme, createThemeContract, style } from '@vanilla-extract/css';

// Define the contract (shape of theme)
export const vars = createThemeContract({
  colors: {
    primary: null,
    secondary: null,
    background: null,
    text: null,
  },
  spacing: {
    small: null,
    medium: null,
    large: null,
  },
  borderRadius: null,
});

// Create light theme
export const lightTheme = createTheme(vars, {
  colors: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#ffffff',
    text: '#333333',
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px',
  },
  borderRadius: '4px',
});

// Create dark theme
export const darkTheme = createTheme(vars, {
  colors: {
    primary: '#5dade2',
    secondary: '#58d68d',
    background: '#1a1a2e',
    text: '#eaeaea',
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px',
  },
  borderRadius: '4px',
});

// Use theme variables in styles
export const card = style({
  background: vars.colors.background,
  color: vars.colors.text,
  padding: vars.spacing.medium,
  borderRadius: vars.borderRadius,
});
```

### Recipes for Variants

```typescript
// button.css.ts
import { recipe, RecipeVariants } from '@vanilla-extract/recipes';
import { vars } from './theme.css';

export const button = recipe({
  base: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: vars.borderRadius,
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },

  variants: {
    variant: {
      primary: {
        background: vars.colors.primary,
        color: 'white',
      },
      secondary: {
        background: vars.colors.secondary,
        color: 'white',
      },
      outline: {
        background: 'transparent',
        border: `2px solid ${vars.colors.primary}`,
        color: vars.colors.primary,
      },
    },
    size: {
      small: { padding: '6px 12px', fontSize: '12px' },
      medium: { padding: '10px 20px', fontSize: '14px' },
      large: { padding: '14px 28px', fontSize: '16px' },
    },
  },

  compoundVariants: [
    {
      variants: {
        variant: 'primary',
        size: 'large',
      },
      style: {
        fontWeight: 700,
      },
    },
  ],

  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
});

// Type-safe variant props
export type ButtonVariants = RecipeVariants<typeof button>;
```

### Sprinkles for Utility Classes

Sprinkles generates atomic utility classes similar to Tailwind:

```typescript
// sprinkles.css.ts
import { createSprinkles, defineProperties } from '@vanilla-extract/sprinkles';

const space = {
  none: '0',
  small: '4px',
  medium: '8px',
  large: '16px',
  xlarge: '32px',
};

const colors = {
  primary: '#3498db',
  secondary: '#2ecc71',
  danger: '#e74c3c',
  white: '#ffffff',
  black: '#000000',
  gray100: '#f7fafc',
  gray900: '#1a202c',
};

const responsiveProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': 'screen and (min-width: 768px)' },
    desktop: { '@media': 'screen and (min-width: 1024px)' },
  },
  defaultCondition: 'mobile',
  properties: {
    display: ['none', 'flex', 'block', 'inline', 'grid'],
    flexDirection: ['row', 'column'],
    justifyContent: ['flex-start', 'center', 'flex-end', 'space-between'],
    alignItems: ['flex-start', 'center', 'flex-end', 'stretch'],
    paddingTop: space,
    paddingBottom: space,
    paddingLeft: space,
    paddingRight: space,
    marginTop: space,
    marginBottom: space,
    gap: space,
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom'],
    marginY: ['marginTop', 'marginBottom'],
  },
});

const colorProperties = defineProperties({
  conditions: {
    default: {},
    hover: { selector: '&:hover' },
    focus: { selector: '&:focus' },
  },
  defaultCondition: 'default',
  properties: {
    color: colors,
    background: colors,
    borderColor: colors,
  },
});

export const sprinkles = createSprinkles(responsiveProperties, colorProperties);

export type Sprinkles = Parameters<typeof sprinkles>[0];
```

Usage:

```tsx
import { sprinkles } from './sprinkles.css';

function Card() {
  return (
    <div
      className={sprinkles({
        display: 'flex',
        flexDirection: { mobile: 'column', tablet: 'row' },
        padding: 'large',
        gap: 'medium',
        background: { default: 'white', hover: 'gray100' },
      })}
    >
      Content
    </div>
  );
}
```

## Performance Considerations

### Runtime Library Overhead

Runtime CSS-in-JS libraries add overhead in several ways:

1. **Bundle size**: The library code itself adds to JavaScript bundle
2. **Style generation**: Parsing template literals and generating CSS at runtime
3. **Style injection**: DOM operations to inject `<style>` tags
4. **Re-renders**: Style recalculation when props change

```jsx
// Performance optimization: Extract static styles
// Instead of:
const Button = styled.button`
  padding: 10px 20px;
  background: ${props => props.primary ? 'blue' : 'gray'};
`;

// Consider:
const staticStyles = css`
  padding: 10px 20px;
`;

const Button = styled.button`
  ${staticStyles}
  background: ${props => props.primary ? 'blue' : 'gray'};
`;
```

### Benchmarks and Comparisons

Based on community benchmarks, approximate performance rankings (faster to slower):

1. **vanilla-extract / Linaria** - Zero runtime, static CSS extraction
2. **Panda CSS** - Zero runtime, atomic CSS
3. **Emotion (css prop with extraction)** - Minimal runtime with SSR
4. **Styled Components / Emotion (styled)** - Full runtime

Bundle size comparison:

| Library | Minified + gzipped |
|---------|-------------------|
| vanilla-extract | ~0kb (zero runtime) |
| Panda CSS | ~0kb (zero runtime) |
| Emotion (react) | ~11kb |
| Styled Components | ~12kb |

### React Server Components Compatibility

Zero-runtime libraries are fully compatible with React Server Components:

```tsx
// This works in Server Components with vanilla-extract
import { container, heading } from './styles.css';

async function Page() {
  const data = await fetchData();

  return (
    <div className={container}>
      <h1 className={heading}>{data.title}</h1>
    </div>
  );
}
```

Runtime libraries require client components:

```tsx
'use client';  // Required for runtime CSS-in-JS

import styled from 'styled-components';

const Container = styled.div`...`;

export function ClientComponent() {
  return <Container>...</Container>;
}
```

### SSR and Hydration

For runtime libraries, proper SSR setup is crucial:

```tsx
// Styled Components SSR with Next.js
// lib/registry.tsx
'use client';

import { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

export default function StyledComponentsRegistry({ children }) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== 'undefined') return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
```

### Optimization Strategies

**1. Minimize Dynamic Props**

```jsx
// Expensive: Many dynamic props
const Box = styled.div`
  width: ${p => p.width}px;
  height: ${p => p.height}px;
  background: ${p => p.bg};
`;

// Better: Use CSS variables for frequently changing values
const Box = styled.div`
  width: var(--width);
  height: var(--height);
  background: var(--bg);
`;

<Box
  style={{
    '--width': `${width}px`,
    '--height': `${height}px`,
    '--bg': bg,
  }}
/>
```

**2. Avoid Inline Style Definitions**

```jsx
// Bad: Creates new styled component every render
function BadComponent() {
  const Box = styled.div`
    padding: 20px;
  `;
  return <Box>Content</Box>;
}

// Good: Define outside component
const Box = styled.div`
  padding: 20px;
`;

function GoodComponent() {
  return <Box>Content</Box>;
}
```

**3. Use Babel Plugin for Optimization**

```json
// babel.config.json for styled-components
{
  "plugins": [
    [
      "babel-plugin-styled-components",
      {
        "displayName": true,
        "fileName": false,
        "pure": true,
        "ssr": true
      }
    ]
  ]
}
```

## Comparison and Selection Criteria

### Feature Comparison

| Feature | Styled Components | Emotion | Panda CSS | vanilla-extract |
|---------|------------------|---------|-----------|-----------------|
| Runtime | Yes | Yes | No | No |
| TypeScript | Good | Good | Excellent | Excellent |
| React Server Components | No | No | Yes | Yes |
| Dynamic Styles | Excellent | Excellent | Limited | Limited |
| Theming | Built-in | Built-in | Built-in | Theme contracts |
| Atomic CSS | No | No | Yes | With Sprinkles |
| Bundle Size | ~12kb | ~11kb | 0kb | 0kb |
| Learning Curve | Low | Low | Medium | Medium |
| SSR Complexity | Medium | Medium | None | None |

### When to Use Each

**Styled Components / Emotion**:
- Highly dynamic styling needs
- Existing projects already using them
- Team familiar with tagged template literals
- Less concern about bundle size
- Client-side heavy applications

**Panda CSS**:
- New projects prioritizing performance
- Design system implementation
- Atomic CSS preference (like Tailwind)
- Full TypeScript support needed
- React Server Components usage

**vanilla-extract**:
- Type safety is a priority
- Maximum performance required
- Complex theming needs
- Build-time CSS generation preferred
- Integration with existing CSS infrastructure

### Migration Considerations

Moving from runtime to zero-runtime CSS-in-JS:

```tsx
// From Styled Components
const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'gray'};
  color: white;
  padding: 10px 20px;
`;

// To vanilla-extract recipes
// button.css.ts
export const button = recipe({
  base: {
    color: 'white',
    padding: '10px 20px',
  },
  variants: {
    primary: {
      true: { background: 'blue' },
      false: { background: 'gray' },
    },
  },
});

// Component
function Button({ primary, children }) {
  return (
    <button className={button({ primary })}>
      {children}
    </button>
  );
}
```

Key migration challenges:
- Truly dynamic styles (based on runtime values) need refactoring
- Theme access patterns change
- Build configuration required
- Learning new APIs

## Interview Focus Points

### Common Interview Questions

1. **What is CSS-in-JS and why would you use it?**

   CSS-in-JS is a styling pattern where CSS is written in JavaScript files. Benefits include component-scoped styles, dynamic styling based on props/state, dead code elimination, and co-location of styles with components.

2. **Explain the difference between runtime and zero-runtime CSS-in-JS.**

   Runtime libraries (Styled Components, Emotion) generate CSS at runtime in the browser, allowing maximum flexibility but with performance overhead. Zero-runtime libraries (vanilla-extract, Panda CSS) extract CSS at build time, producing static stylesheets with zero JavaScript runtime cost.

3. **How does Styled Components handle dynamic props?**

   ```jsx
   const Button = styled.button`
     background: ${props => props.primary ? 'blue' : 'gray'};
     font-size: ${props => props.size === 'large' ? '18px' : '14px'};
   `;
   ```
   Props are passed to template literal interpolations, allowing runtime style computation.

4. **What are the performance implications of CSS-in-JS?**

   Runtime CSS-in-JS adds:
   - Bundle size overhead (~10-12kb)
   - Style parsing and generation at runtime
   - DOM operations for style injection
   - Potential layout shifts during hydration

   Zero-runtime solutions eliminate these issues by generating static CSS.

5. **How do you handle theming in CSS-in-JS?**

   Using ThemeProvider pattern:
   ```jsx
   <ThemeProvider theme={theme}>
     <App />
   </ThemeProvider>

   // Access in styled components
   const Button = styled.button`
     background: ${({ theme }) => theme.colors.primary};
   `;
   ```

6. **What are the trade-offs between CSS Modules and CSS-in-JS?**

   CSS Modules:
   - Zero runtime overhead
   - Standard CSS syntax
   - Limited dynamic styling
   - Separate file management

   CSS-in-JS:
   - Runtime overhead (for some libraries)
   - Full JavaScript power for dynamic styles
   - Co-located with components
   - Better TypeScript integration

### Practical Coding Exercise

**Task**: Create a reusable Button component with variants using CSS-in-JS.

```jsx
// Solution with Styled Components
import styled, { css } from 'styled-components';

const variants = {
  primary: css`
    background: #3498db;
    color: white;
    &:hover { background: #2980b9; }
  `,
  secondary: css`
    background: #95a5a6;
    color: white;
    &:hover { background: #7f8c8d; }
  `,
  outline: css`
    background: transparent;
    border: 2px solid #3498db;
    color: #3498db;
    &:hover { background: #3498db; color: white; }
  `,
};

const sizes = {
  small: css`padding: 6px 12px; font-size: 12px;`,
  medium: css`padding: 10px 20px; font-size: 14px;`,
  large: css`padding: 14px 28px; font-size: 16px;`,
};

const Button = styled.button`
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  ${props => variants[props.$variant] || variants.primary}
  ${props => sizes[props.$size] || sizes.medium}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
  }
`;

Button.defaultProps = {
  $variant: 'primary',
  $size: 'medium',
};

export default Button;
```

## Further Reading

### Official Documentation

- [Styled Components Documentation](https://styled-components.com/docs)
- [Emotion Documentation](https://emotion.sh/docs/introduction)
- [Panda CSS Documentation](https://panda-css.com/docs)
- [vanilla-extract Documentation](https://vanilla-extract.style/)

### Related Libraries

- **Linaria** - Zero-runtime CSS-in-JS with Styled Components-like API
- **Griffel** - Microsoft's zero-runtime CSS-in-JS solution
- **StyleX** - Meta's compile-time CSS-in-JS library
- **Pigment CSS** - MUI's zero-runtime CSS-in-JS solution

### Tools and Extensions

- **Styled Components VSCode Extension** - Syntax highlighting and IntelliSense
- **vscode-styled-components** - CSS language features in template literals
- **Panda CSS VSCode Extension** - Autocomplete and design token support

## Summary

CSS-in-JS represents a significant evolution in how we approach styling in component-based applications. The key takeaways are:

1. **Runtime vs Zero-Runtime**: Choose based on your needs for dynamic styling versus performance
2. **Styled Components and Emotion**: Mature, flexible solutions with great DX but runtime overhead
3. **Panda CSS and vanilla-extract**: Modern, performant alternatives with excellent TypeScript support
4. **Performance matters**: Consider the impact on bundle size, SSR, and React Server Components
5. **No one-size-fits-all**: Select the library that best matches your project requirements

The trend is moving toward zero-runtime solutions as React Server Components become more prevalent and performance expectations increase. However, runtime solutions remain valuable for their flexibility and ease of use, especially in client-heavy applications.

When starting a new project, consider:
- Your team's familiarity with the tooling
- The importance of React Server Components
- Dynamic styling requirements
- Build system compatibility
- Long-term maintenance considerations

CSS-in-JS will continue to evolve, with the ecosystem moving toward better performance, type safety, and compatibility with modern React patterns.
