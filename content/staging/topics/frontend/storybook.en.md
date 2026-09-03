---
title: Storybook Component Development
description: Use Storybook for UI component development and documentation
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Storybook
  - component development
  - UI docs
  - testing
status: imported
origin: old/src/content/docs/frontend/storybook.en.md
divergence: 0.193
issues: []
legacy:
  category: Frontend
  subcategory: Tools
  order: 42
  lastUpdated: 2026-01-07
---

Storybook is a frontend workshop for building UI components and pages in isolation. It enables developers to create, test, and document components independently from the main application, leading to more robust and reusable UI elements. We cover everything from initial setup to advanced testing and documentation strategies.

## Introduction to Storybook

### What is Storybook?

Storybook provides an isolated development environment where you can build and showcase components without running your entire application. Each component variation is captured as a "story" that represents a specific state or use case.

### Key Benefits

1. **Isolated Development**: Build components without navigating through your app or setting up complex state
2. **Visual Documentation**: Automatically generate a living component library
3. **Testing Environment**: Test components in isolation with various inputs and states
4. **Team Collaboration**: Share a visual reference of components with designers and stakeholders
5. **Framework Agnostic**: Works with React, Vue, Angular, Svelte, and more

## Setting Up Storybook

### Installation

Storybook can be installed in any existing project using the CLI. The installer automatically detects your framework and configures the appropriate settings.

```bash
# Initialize Storybook in an existing project
npx storybook@latest init
```

The CLI performs several actions:
1. Detects your framework (React, Vue, Angular, etc.)
2. Installs required dependencies
3. Creates `.storybook/main.ts` configuration
4. Creates `.storybook/preview.ts` for global settings
5. Adds example stories to get started

### Running Storybook

```bash
# Start development server
npx storybook dev -p 6006

# Build static Storybook for deployment
npx storybook build -o storybook-static
```

### Project Structure

After installation, your project will contain:

```
.storybook/
  main.ts          # Main configuration file
  preview.ts       # Global decorators and parameters
src/
  components/
    Button/
      Button.tsx
      Button.stories.tsx   # Stories for the Button component
```

### Configuration Files

**main.ts** - Core Storybook configuration:

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

**preview.ts** - Global story configuration:

```typescript
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

## Writing Stories

### Component Story Format (CSF)

Stories are written using the Component Story Format, which uses ES6 modules as the foundation. Each story file exports a default metadata object and named exports for each story.

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// Meta object describes the component
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Each export is a story
export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'Secondary Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    label: 'Delete',
  },
};
```

### Story Organization

Stories are organized hierarchically using the `title` property:

```typescript
// Creates: Components / Forms / Input
const meta: Meta<typeof Input> = {
  title: 'Components/Forms/Input',
  component: Input,
};
```

### Multiple Stories from Base Args

Build variations efficiently by extending base configurations:

```typescript
const meta: Meta<typeof Button> = {
  component: Button,
  args: {
    // Default args for all stories
    label: 'Button',
    disabled: false,
  },
};

export default meta;

export const Small: Story = {
  args: {
    size: 'small',
  },
};

export const Medium: Story = {
  args: {
    size: 'medium',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
```

## Args and Controls

### Understanding Args

Args are the inputs that define how a component renders. They are mapped to component props and can be edited live through the Controls panel.

```typescript
export const WithIcon: Story = {
  args: {
    label: 'Download',
    icon: 'download',
    iconPosition: 'left',
    variant: 'primary',
  },
};
```

### ArgTypes Configuration

Define how controls appear in the panel:

```typescript
const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    // Select dropdown
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
      description: 'Visual style variant',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    // Color picker
    backgroundColor: {
      control: 'color',
    },
    // Range slider
    size: {
      control: { type: 'range', min: 10, max: 100, step: 5 },
    },
    // Boolean toggle
    disabled: {
      control: 'boolean',
    },
    // Text input
    label: {
      control: 'text',
    },
    // Object editor
    style: {
      control: 'object',
    },
    // Disable control for certain args
    onClick: {
      action: 'clicked',
      table: { disable: true },
    },
  },
};
```

### Control Types

Storybook provides various control types:

| Control Type | Description | Use Case |
|--------------|-------------|----------|
| `text` | Text input | Strings |
| `boolean` | Checkbox toggle | Boolean props |
| `number` | Number input | Numeric values |
| `range` | Slider | Bounded numbers |
| `select` | Dropdown | Enum values |
| `radio` | Radio buttons | Small option sets |
| `color` | Color picker | Color values |
| `date` | Date picker | Date objects |
| `object` | JSON editor | Objects/arrays |
| `file` | File upload | File inputs |

### Actions for Callbacks

The Actions addon logs callback invocations:

```typescript
const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    onClick: { action: 'clicked' },
    onHover: { action: 'hovered' },
  },
};

export const Interactive: Story = {
  args: {
    label: 'Click me',
  },
  // Actions are automatically logged in the Actions panel
};
```

## Decorators

Decorators wrap stories with additional markup or context. They are useful for providing themes, layouts, and global state.

### Story-Level Decorators

```typescript
export const Themed: Story = {
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', background: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
};
```

### Component-Level Decorators

Apply decorators to all stories in a file:

```typescript
const meta: Meta<typeof Modal> = {
  component: Modal,
  decorators: [
    (Story) => (
      <div style={{ minHeight: '500px' }}>
        <Story />
      </div>
    ),
  ],
};
```

### Global Decorators

Apply decorators to all stories in `.storybook/preview.ts`:

```typescript
import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/contexts/ThemeContext';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;
```

### Context Provider Decorators

Common pattern for providing application context:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};
```

### Creating Reusable Decorators

```typescript
// decorators/withPadding.tsx
export const withPadding = (padding: string) => (Story: React.ComponentType) => (
  <div style={{ padding }}>
    <Story />
  </div>
);

// Usage in stories
export const Padded: Story = {
  decorators: [withPadding('2rem')],
};
```

### Custom Addon Decorators

For advanced use cases, create decorators using the Storybook API:

```typescript
import { makeDecorator } from 'storybook/preview-api';

export const withCustomWrapper = makeDecorator({
  name: 'withCustomWrapper',
  parameterName: 'customWrapper',
  skipIfNoParametersOrOptions: true,
  wrapper: (getStory, context, { parameters }) => {
    // Custom logic based on parameters
    return getStory(context);
  },
});
```

## Addons

Addons extend Storybook with additional functionality. The essentials package includes commonly used addons.

### Essential Addons

Install the essentials package:

```bash
npm install @storybook/addon-essentials --save-dev
```

This includes:
- **Controls**: Edit props dynamically
- **Actions**: Log callback invocations
- **Viewport**: Test responsive layouts
- **Backgrounds**: Switch background colors
- **Docs**: Generate documentation
- **Toolbars**: Add custom toolbar items

### Viewport Addon

Test responsive designs by simulating different screen sizes:

```typescript
const meta: Meta<typeof Card> = {
  component: Card,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Or configure custom viewports globally
const preview: Preview = {
  parameters: {
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
  },
};
```

### Backgrounds Addon

Configure background options:

```typescript
const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
  },
};
```

### Installing Additional Addons

```bash
# Accessibility testing
npm install @storybook/addon-a11y --save-dev

# Design integration
npm install @storybook/addon-designs --save-dev

# Storybook interactions
npm install @storybook/addon-interactions --save-dev
```

Register addons in `.storybook/main.ts`:

```typescript
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
};
```

## Visual Testing

Visual testing catches unintended UI changes by comparing screenshots across builds.

### Chromatic Integration

Chromatic is a visual testing service built by Storybook maintainers:

```bash
# Install Chromatic
npm install chromatic --save-dev

# Run visual tests
npx chromatic --project-token=<your-token>
```

### Snapshot Testing with Test Runner

The test runner executes stories as tests:

```bash
npm install @storybook/test-runner --save-dev
```

Add to `package.json`:

```json
{
  "scripts": {
    "test-storybook": "test-storybook"
  }
}
```

### Interaction Testing

Write interaction tests using the play function:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor } from 'storybook/test';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SuccessfulLogin: Story = {
  args: {
    onSubmit: async (credentials) => ({ success: true }),
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step('Enter credentials', async () => {
      await userEvent.type(canvas.getByLabelText('Email'), 'user@example.com');
      await userEvent.type(canvas.getByLabelText('Password'), 'password123');
    });

    await step('Submit form', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /log in/i }));
    });

    await step('Verify success', async () => {
      await waitFor(
        () => expect(canvas.getByText('Login successful')).toBeInTheDocument(),
        { timeout: 3000 }
      );
    });

    await step('Verify callback called', async () => {
      await expect(args.onSubmit).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  },
};

export const ValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /log in/i }));
    await expect(canvas.getByText('Email is required')).toBeInTheDocument();
    await expect(canvas.getByText('Password is required')).toBeInTheDocument();
  },
};
```

### Accessibility Testing

Integrate accessibility testing with axe-playwright:

```typescript
// .storybook/test-runner.ts
import type { TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext } from '@storybook/test-runner';
import { injectAxe, checkA11y } from 'axe-playwright';

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);

    // Skip if a11y is disabled for this story
    if (storyContext.parameters?.a11y?.disable) {
      return;
    }

    await checkA11y(page, 'body', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  },
};

export default config;
```

Configure accessibility rules per story:

```typescript
export const AccessibleForm: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(canvas.getByLabelText('Password')).toHaveAttribute('type', 'password');

    // Test keyboard navigation
    await userEvent.tab();
    expect(canvas.getByLabelText('Email')).toHaveFocus();
    await userEvent.tab();
    expect(canvas.getByLabelText('Password')).toHaveFocus();
  },
};
```

## Component Documentation

### Autodocs

Enable automatic documentation generation:

```typescript
const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'], // Enable autodocs for this component
};
```

### JSDoc Comments

Add descriptions using JSDoc:

```typescript
interface ButtonProps {
  /**
   * The button variant determines its visual style
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost';

  /**
   * Button content
   */
  children: React.ReactNode;

  /**
   * Disables the button when true
   */
  disabled?: boolean;

  /**
   * Callback fired when the button is clicked
   */
  onClick?: () => void;
}
```

### MDX Documentation

Create rich documentation pages with MDX:

```mdx
{/* Button.mdx */}
import { Meta, Story, Canvas, Controls, Description } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

<Description of={ButtonStories} />

Buttons trigger actions when clicked. Use them to submit forms, open dialogs, or navigate.

## Usage Guidelines

- Use primary buttons for the main action
- Use secondary buttons for alternative actions
- Avoid using multiple primary buttons in one view

## Examples

### Primary Button

<Canvas of={ButtonStories.Primary} />

### Controls

<Controls of={ButtonStories.Primary} />

## Variants

<Canvas>
  <Story of={ButtonStories.Primary} />
  <Story of={ButtonStories.Secondary} />
  <Story of={ButtonStories.Ghost} />
</Canvas>
```

### Custom Documentation Pages

Create standalone documentation:

```mdx
{/* Introduction.mdx */}
import { Meta } from '@storybook/blocks';

<Meta title="Introduction" />

# Design System

Welcome to our component library. This documentation provides guidelines
for using our shared UI components.

## Getting Started

Install the package:

```bash
npm install @company/ui-components
```

Import and use components:

```jsx
import { Button } from '@company/ui-components';

function App() {
  return <Button variant="primary">Click me</Button>;
}
```
```

## Best Practices

### Story Organization

1. **Group by Feature**: Organize stories by component category (Forms, Navigation, Layout)
2. **Consistent Naming**: Use clear, descriptive story names
3. **Show Edge Cases**: Include stories for loading, empty, error, and edge states

### Writing Effective Stories

```typescript
// Show common use cases
export const Default: Story = {};

// Show variations
export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };

// Show states
export const Loading: Story = { args: { isLoading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithError: Story = { args: { error: 'Something went wrong' } };

// Show compositions
export const InCard: Story = {
  decorators: [
    (Story) => (
      <Card>
        <Story />
      </Card>
    ),
  ],
};
```

### Performance Optimization

1. **Lazy Loading**: Configure story lazy loading for large projects
2. **Story Isolation**: Each story should be independent
3. **Mock External Dependencies**: Use MSW for API mocking

```typescript
// Mock API requests with MSW
import { http, HttpResponse } from 'msw';

export const WithMockedData: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users', () => {
          return HttpResponse.json([
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' },
          ]);
        }),
      ],
    },
  },
};
```

### CI/CD Integration

Add Storybook to your CI pipeline:

```yaml
# .github/workflows/storybook.yml
name: Storybook

on: [push]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Build Storybook
        run: npm run build-storybook

      - name: Run Storybook tests
        run: npm run test-storybook
```

## Further Reading

### Official Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Component Story Format](https://storybook.js.org/docs/api/csf)
- [Storybook Addons](https://storybook.js.org/addons)

### Testing Resources

- [Interaction Testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Visual Testing with Chromatic](https://www.chromatic.com/docs)
- [Accessibility Testing](https://storybook.js.org/docs/writing-tests/accessibility-testing)

### Community

- [Storybook GitHub](https://github.com/storybookjs/storybook)
- [Discord Community](https://discord.gg/storybook)
- [Storybook Blog](https://storybook.js.org/blog)

## Summary

Storybook transforms component development by providing an isolated environment for building, testing, and documenting UI components. Key takeaways from this guide:

1. **Setup is Simple**: The CLI auto-detects your framework and configures everything
2. **Stories Define States**: Each story represents a specific component configuration
3. **Args Enable Interactivity**: The Controls panel lets you edit props in real-time
4. **Decorators Provide Context**: Wrap stories with providers, layouts, and themes
5. **Addons Extend Functionality**: Viewport, backgrounds, accessibility, and more
6. **Testing is Built-in**: Interaction tests, visual regression, and accessibility checks
7. **Documentation is Automatic**: Generate living documentation from your components

By adopting Storybook in your workflow, you create a shared language between developers and designers, catch bugs earlier in development, and build a reusable component library that scales with your application.
