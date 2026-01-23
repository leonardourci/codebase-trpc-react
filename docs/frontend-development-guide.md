# Frontend Development Guide

This guide explains how to build components and features using the Frontend Foundation patterns we've implemented.

---

## Stack

* **React 19** (without `forwardRef`)
* **TypeScript** strict mode
* **Tailwind CSS** with custom CSS variables and mobile-first approach
* **shadcn/ui** for accessible, customizable component primitives (updated for React 19)
* **class-variance-authority** (`cva`) for component variants
* **Tailwind Merge** (`tailwind-merge`) for class merging
* **Lucide React** for icons

---

## Naming Conventions

* Files: **PascalCase** → `Button.tsx`, `UserCard.tsx`, `useModal.ts`
* **Mix of default and named exports** (follow existing patterns)
* Components use PascalCase, utilities use camelCase

---

## Component Structure

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

const buttonVariants = cva(
  [
    'inline-flex cursor-pointer items-center justify-center font-medium rounded-lg border transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        default: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ 
  className, 
  variant, 
  size, 
  disabled, 
  ref,
  children, 
  ...props 
}: ButtonProps) {
  return (
    <button
      ref={ref}
      data-slot="button"
      data-disabled={disabled ? '' : undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
```

---

## Compound Components

```tsx
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

export interface CardProps extends ComponentProps<'div'> {}

export function Card({ className, ref, ...props }: CardProps) {
  return (
    <div
      ref={ref}
      data-slot="card"
      className={cn('bg-card flex flex-col gap-6 rounded-xl border border-border p-6 shadow-sm', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ref, ...props }: ComponentProps<'div'>) {
  return <div ref={ref} data-slot="card-header" className={cn('flex flex-col gap-1.5', className)} {...props} />
}

export function CardTitle({ className, ref, ...props }: ComponentProps<'h3'>) {
  return <h3 ref={ref} data-slot="card-title" className={cn('text-lg font-semibold', className)} {...props} />
}

export function CardContent({ className, ref, ...props }: ComponentProps<'div'>) {
  return <div ref={ref} data-slot="card-content" className={className} {...props} />
}
```

---

## Colors (CSS Variables)

Our color system uses CSS variables defined in `src/index.css`:

```
bg-background, bg-card → backgrounds
bg-primary, bg-secondary, bg-muted → actions and states
bg-destructive → errors and danger states

text-foreground → primary text
text-muted-foreground → secondary/disabled text
text-primary-foreground → text on primary background

border-border, border-input → default borders
border-primary, border-destructive → emphasized borders

ring-ring → focus ring
```

---

## TypeScript Patterns

```tsx
// ✅ Extend ComponentProps + VariantProps
export interface ButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {}

// ✅ Use `import type` for types
import type { ComponentProps } from 'react'
import type { VariantProps } from 'class-variance-authority'

// ✅ React 19 - ref is just a regular prop
function Button({ ref, ...props }: ButtonProps) {
  return <button ref={ref} {...props} />
}

// ❌ Don't use React.FC or forwardRef (React 19)
```

---

## Important Patterns

```tsx
// Always use cn() for className merging
className={cn('base-classes', className)}

// Always use data-slot for component identification
<div data-slot="card">

// State via data attributes
data-disabled={disabled ? '' : undefined}
className="disabled:opacity-50 data-[disabled]:pointer-events-none"

// Focus visible styles
'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Icons with consistent sizing
<Check className="h-4 w-4" />
'[&_svg]:h-4 [&_svg]:w-4' // inside variants

// Icon-only buttons require aria-label
<button aria-label="Close"><X className="h-4 w-4" /></button>

// Props spread at the end
{...props}
```

---

## File Organization

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components (Button, Input, Card, etc.)
│   ├── layout/          # Layout components (Header, Sidebar, Footer)
│   ├── forms/           # Form-specific components
│   └── custom/          # Custom business components
├── pages/               # Page components and routing
├── hooks/               # Custom React hooks
├── services/            # tRPC client and authentication logic
├── utils/               # Utility functions and helpers
├── lib/                 # shadcn/ui utilities and tRPC configuration
├── types/               # TypeScript type definitions
└── assets/              # Static assets (images, icons)
```

---

## Development Checklist

When creating new components:

* [ ] Use PascalCase file names
* [ ] Export both default and named exports as appropriate
* [ ] `ComponentProps<'element'>` + `VariantProps` for props
* [ ] Variants with `cva()`, classes merged with `cn()`
* [ ] `data-slot` used for component identification
* [ ] State handled via `data-[state]:` classes
* [ ] Custom colors from CSS variables only
* [ ] Focus visible styles on interactive elements
* [ ] `aria-label` on icon-only buttons
* [ ] `{...props}` spread at the end
* [ ] Mobile-first responsive design

---

## Examples

### Creating a New Component

```tsx
// src/components/ui/Badge.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'border border-input bg-background text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends ComponentProps<'div'>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ref, ...props }: BadgeProps) {
  return (
    <div
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}
```

### Using Components

```tsx
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

function MyPage() {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="default" size="lg">
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Best Practices

1. **Mobile-First**: Always start with mobile styles and use responsive prefixes (`md:`, `lg:`)
2. **Accessibility**: Include proper ARIA labels and semantic HTML
3. **Performance**: Use `cn()` for efficient class merging
4. **Consistency**: Follow the established patterns for variants and props
5. **Testing**: Use `data-slot` attributes for reliable component testing
6. **Type Safety**: Leverage TypeScript for better developer experience

---

## Common Patterns

### Form Components
```tsx
// Always include proper form semantics
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium">
    Email
  </label>
  <Input id="email" type="email" placeholder="Enter your email" />
</div>
```

### Responsive Design
```tsx
// Mobile-first approach
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>
```

### Loading States
```tsx
<Button disabled={isLoading} data-loading={isLoading ? '' : undefined}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

This guide should help you maintain consistency while building new features with our Frontend Foundation!