# Frontend Build Contract

## POS + Inventory SaaS — MVP 1

## Target Stack: Next.js 16.2.3, TypeScript, App Router

---

## 1. Mission

You are building the **complete frontend** for the POS + Inventory SaaS MVP 1.

This document is the **source of truth for frontend implementation**. Follow it exactly.  
The goal is not just to make pages that look correct, but to produce a frontend codebase that is:

- clean
- scalable
- modular
- reusable
- SSR-first
- easy to extend
- easy to hand off to another developer later

This is a frontend-only task. **No backend API implementation is required**.  
The UI should be built as a polished, production-grade experience using mocked/local data and UI state only.

The product scope, screens, workflows, and business rules come from the MVP 1 PRD. The frontend must represent those flows faithfully, including all screens and interaction states described there. fileciteturn0file0

---

## 2. Non-Negotiable Principles

### 2.1 Server Components by Default

Everything must be a Server Component unless there is a clear reason it must be interactive on the client.

Use `"use client"` only for the smallest possible leaf component when one of the following is needed:

- input handling
- button clicks
- dropdown open/close state
- modals
- tabs
- accordions
- local UI state
- optimistic visual interactions
- search input behavior
- form validation behavior

Never convert a whole page to a client component just because one small part needs interaction.

### 2.2 Keep Client Islands Small

When a section needs client-side behavior, isolate only that section.  
Examples:

- page remains server-rendered
- search bar is client
- cart actions are client
- modal is client
- summary panel stays server if it is display-only

### 2.3 No Backend Dependence

Do not implement any real backend logic.

- no API routes
- no fetch calls to server endpoints
- no database access
- no auth service integration
- no server mutations

Use mock data, local UI state, static fixtures, and reusable mock helpers.

### 2.4 No Code Repetition

Do not duplicate layout, card, button, form, or table logic.

If something appears twice, it must be extracted into a reusable component, hook, utility, or shared configuration.

### 2.5 Build for Future Backend Integration

Even though backend functionality is not being built now, the frontend structure must be future-proof.

That means:

- domain models should mirror the PRD shapes
- props should be typed
- forms should anticipate future wiring
- visual states should support loading, empty, error, success, and disabled states
- components should not be tightly coupled to mock data sources

---

## 3. Product Experience Goals

The UI should feel:

- modern
- clean
- efficient
- trustworthy
- focused
- operational
- business-like, not playful
- easy for a shopkeeper to scan quickly

This is a daily-use business tool. The interface should reduce friction.

The visual style should communicate:

- clarity
- speed
- control
- precision
- financial seriousness

Avoid decorative complexity. Avoid visual noise.  
Every pixel should help the user work faster.

---

## 4. Tech and Implementation Rules

### 4.1 Stack Rules

Use:

- Next.js 16.2.3
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui or equivalent headless primitives for base patterns
- Lucide icons or a similarly consistent icon set
- Framer Motion only when motion is truly useful and lightweight

### 4.2 Styling Rules

- Prefer Tailwind utility classes
- Avoid custom CSS files unless absolutely necessary
- Keep styling tokens centralized
- Use consistent spacing, radius, shadows, borders, and text scales
- Do not invent new visual patterns per page
- Keep the UI aligned with a single design system

### 4.3 Data Rules

Because this is frontend-only:

- use typed mock data
- keep mock data in a dedicated layer
- separate mock fixtures from UI components
- make mock data resemble real production records
- keep all business entities consistent with the PRD data model

### 4.4 State Rules

Use the lightest possible state approach.

Preferred order:

1. local component state
2. lifted state
3. small focused context only when necessary
4. avoid global state unless genuinely useful for UI shell state

Do not introduce complex state libraries for this frontend-only build unless there is a strong reason.

---

## 5. Folder Structure

Use a clear, scalable structure.

```txt
app/
  (auth)/
    login/
    signup/
    forgot-password/
    reset-password/
    layout.tsx

  (onboarding)/
    business/
    outlet/
    gst/
    layout.tsx

  (dashboard)/
    layout.tsx
    page.tsx
    products/
      page.tsx
      new/
      [id]/
        edit/
      import/
    invoices/
      page.tsx
      [id]/
    deficits/
      page.tsx
    settings/
      page.tsx

components/
  ui/
  layouts/
  shell/
  forms/
  tables/
  cards/
  dialogs/
  navigation/
  status/
  empty-states/
  typography/
  icons/

features/
  billing/
  products/
  invoices/
  deficits/
  onboarding/
  auth/
  settings/

lib/
  mock-data/
  constants/
  utils/
  formatters/
  validators/
  routes/
  data-shapes/

hooks/
  use-debounced-value.ts
  use-media-query.ts
  use-mounted.ts
  use-local-storage.ts

types/
  index.ts
  auth.ts
  billing.ts
  product.ts
  invoice.ts
  deficit.ts
  settings.ts

styles/
  globals.css

public/
  images/
  icons/
```

### Structure Rules

- `app/` contains routes only
- `components/ui/` contains generic primitives only
- `features/` contains domain-specific UI sections
- `lib/` contains data, constants, formatting, and pure utilities
- `types/` contains shared TypeScript types
- route files must stay thin and delegate UI to components

---

## 6. Component Design System Rules

### 6.1 Component Tiers

Build components in this order:

#### Tier 1 — UI Primitives

These are the smallest reusable pieces.

Examples:

- Button
- Input
- Select
- Badge
- Card
- Dialog
- Separator
- Tabs
- Tooltip
- Skeleton

Rules:

- no page-specific text
- no business logic
- no hardcoded product behavior
- no data assumptions
- must be configurable by props

#### Tier 2 — Shared Domain Components

These are reusable across multiple pages.

Examples:

- PageHeader
- StatCard
- SearchBar
- DataTable
- EmptyState
- SectionCard
- MoneyText
- QuantityStepper
- StatusBadge
- FilterBar

Rules:

- reusable across features
- should not fetch data
- should not know about routes unless explicitly passed
- should stay presentational where possible

#### Tier 3 — Feature Components

These are domain-aware sections.

Examples:

- BillingCart
- BillingSummary
- ProductForm
- InvoiceFilters
- DeficitList
- SettingsBusinessPanel

Rules:

- may combine multiple shared components
- should contain business-specific UI logic only
- keep them small and composable

### 6.2 Composition Rule

Prefer composition over branching.

Instead of creating one giant flexible component with dozens of conditions, split into a few smaller components that compose naturally.

### 6.3 Variant Rule

When a component has multiple visual states, support them through:

- `variant`
- `size`
- `tone`
- `state`

Do not create separate components for tiny visual differences.

### 6.4 Props Rule

Props should be:

- explicit
- typed
- minimal
- predictable

Do not pass giant `any` objects.

---

## 7. SSR-First Rendering Rules

### 7.1 Default Rule

All route pages must render on the server unless the page truly cannot work without client state.

### 7.2 Correct SSR Boundaries

Server-rendered pages should handle:

- layout
- content structure
- static text
- metadata
- initial mock data rendering
- route composition

Client-rendered components should handle only:

- user interaction
- transient local state
- browser-only APIs
- modal open/close state
- form input state
- search typing
- toggles
- tabs
- accordions
- temporary UI feedback

### 7.3 Avoid Unnecessary Hydration

Do not mark entire layouts, pages, or large sections as client components.

Only isolate the smallest interactive piece.

### 7.4 Browser API Rule

Any code using:

- `window`
- `document`
- `localStorage`
- `sessionStorage`
- `indexedDB`
- `matchMedia`

must live inside client components or guarded hooks.

---

## 8. Visual Language

The app must use a refined business UI style.

### 8.1 Color Strategy

Use a restrained palette.

Primary direction:

- one strong primary color for actions and emphasis
- neutral background system
- semantic colors for success, warning, error, and info

The interface should not feel colorful for its own sake.

Recommended feel:

- calm neutrals
- subtle borders
- soft contrast
- clear hierarchy

### 8.2 Layout Character

- generous whitespace
- clear section separation
- cards used consistently
- sticky topbar where appropriate
- sidebar for dashboard sections
- content-first layout
- right-side summaries for transaction-heavy screens

### 8.3 Typography

- strong page titles
- medium section titles
- readable body copy
- compact table typography
- numbers should be visually easy to scan

### 8.4 Shape and Depth

- rounded corners
- subtle shadows
- light borders
- no heavy glassmorphism
- no aggressive gradients
- no cluttered decorations

### 8.5 Motion Philosophy

Motion should be helpful, not theatrical.

Use motion for:

- modal entry/exit
- drawer open/close
- dropdown expansion
- toast appearance
- page section reveal
- subtle hover lift
- loading skeleton transitions
- drag-free state changes

Avoid:

- constant looping animation
- large page transitions
- bouncy UI
- excessive parallax
- flashy effects

---

## 9. Navigation Rules

### 9.1 App Shell Navigation

The authenticated area should use a consistent shell with:

- left sidebar on desktop
- top bar across all authenticated pages
- compact mobile navigation
- clear active route highlighting

### 9.2 Primary Navigation Items

The main app navigation should reflect the product structure:

- Billing
- Products
- Invoices
- Deficits
- Settings

### 9.3 Secondary Navigation

Use secondary navigation only where needed, such as:

- product subpages
- auth flow steps
- onboarding steps
- invoice detail back navigation

### 9.4 Mobile Navigation

On mobile:

- sidebar should collapse into a drawer or bottom sheet
- top bar actions should remain accessible
- important actions should not be hidden behind tiny targets

### 9.5 Route Flow Rules

Auth and onboarding should feel separate from the main app shell.

Suggested structure:

- auth screens: clean standalone layout
- onboarding screens: guided step layout
- dashboard screens: full app shell layout

---

## 10. Page-by-Page Build Rules

This section defines what each page should contain. Follow it closely.

### 10.1 Login Page

Purpose: allow existing users to enter the app.

Contains:

- email field
- password field
- login button
- forgot password link
- signup link
- clear validation and error UI
- simple trust-building layout

UX rules:

- no distraction
- no unnecessary marketing content
- focused and quick

### 10.2 Signup Page

Purpose: create an account.

Contains:

- email
- password
- password rules helper
- confirm action
- login link

UX rules:

- emphasize account creation
- keep form centered and obvious
- make validation readable

### 10.3 Forgot Password Page

Purpose: request a reset email.

Contains:

- email field
- submit button
- explanatory text
- success confirmation state

UX rules:

- message should feel safe and calm
- avoid exposing account existence details

### 10.4 Reset Password Page

Purpose: set a new password from a tokenized link.

Contains:

- new password
- confirm password
- token validation state
- success state
- return-to-login action

UX rules:

- make invalid token states clearly understandable
- keep the form compact

---

### 10.5 Onboarding — Business Page

Purpose: collect business identity.

Contains:

- business name input
- generated abbreviation field
- editable abbreviation input
- helper text explaining abbreviation behavior
- continue button
- progress indicator for the onboarding flow

Rules:

- show the abbreviation preview clearly
- keep the experience guided
- make the step feel like setup, not admin work

### 10.6 Onboarding — Outlet Page

Contains:

- outlet name input
- abbreviation preview
- editable abbreviation input
- continue button
- onboarding progress indicator

Rules:

- same interaction model as business step
- visually consistent with the previous step

### 10.7 Onboarding — GST Page

Contains:

- optional GST number input
- validation hint if invalid format
- finish setup button
- clear note that it can be updated later

Rules:

- do not overload the page
- keep the optional nature obvious

---

### 10.8 Billing Page

This is the most important screen.

It should be the most polished and most efficient page in the app.

Contains:

- top search bar
- product results list or panel
- selected cart items
- bill summary panel
- customer details section
- payment method section
- GST toggle in top navigation
- finalize button
- clear bill action
- refresh stock action
- insufficient stock modal
- success state after invoice generation

Layout direction:

- desktop: two-panel or three-panel workspace
- left/main: search + cart
- right: summary + actions
- mobile: stacked sections with sticky action area

Rules:

- make item scanning easy
- keep totals visually prominent
- show quantity controls clearly
- highlight payment method status
- make the final action easy to find

### 10.9 Products Page

Contains:

- page header with add product action
- search field
- show deleted toggle
- import CSV action
- product table or card list
- stock update action
- edit action
- delete/restore action

Rules:

- stock values should be easy to scan
- list density should balance information and readability
- use a strong empty state if no products exist

### 10.10 Add Product Page

Contains:

- name
- base price
- GST rate
- opening stock
- deficit threshold
- save/cancel actions

Rules:

- forms should be well grouped
- numeric inputs should be clearly labeled
- helper text should reduce mistakes

### 10.11 Edit Product Page

Contains:

- same base fields as add product
- clear distinction between editable and non-editable state if applicable
- save action

Rules:

- preserve the same layout as add product to reduce cognitive load
- reuse the same form components

### 10.12 CSV Import Page

Contains:

- upload area
- template download button
- file instructions
- import preview or validation summary
- row error list
- results summary

Rules:

- make the process understandable
- give strong feedback on errors
- keep the upload flow frictionless

### 10.13 Invoices Page

Contains:

- date range filter
- invoice number search
- payment method filter
- GST type filter
- product search filter
- invoice list
- pagination controls

Rules:

- filters should be visually grouped
- rows should read quickly
- totals and metadata should be clearly separated

### 10.14 Invoice Detail Page

Contains:

- invoice metadata
- invoice status labels
- customer info
- itemized table
- GST visibility based on invoice type
- totals breakdown
- back link to invoice list

Rules:

- this should feel like a record view, not an edit screen
- emphasize clarity and traceability

### 10.15 Deficits Page

Contains:

- grouped deficit overview
- product-level expansion
- pending count and quantities
- threshold warnings
- resolution actions
- linked invoice references

Rules:

- use visual warning states carefully
- keep the hierarchy obvious
- make the relationship between deficit and invoice easy to understand

### 10.16 Settings Page

Contains:

- business information
- outlet information
- GST settings
- password update section
- logout action

Rules:

- separate identity, tax, and account settings visually
- avoid mixing unrelated controls into one block
- keep read-only and editable states visually different

---

## 11. Layout Rules by Screen Type

### 11.1 Auth Layout

- centered form layout
- minimal background noise
- no dashboard sidebar
- concise copy

### 11.2 Onboarding Layout

- guided stepper feel
- progress indication
- calm, uncluttered sections
- single primary action per step

### 11.3 Dashboard Layout

- sidebar
- topbar
- page content area
- optional right-side summary zones on dense pages

### 11.4 Data-Heavy Pages

For products, invoices, and deficits:

- use tables where scanning is better
- use cards if mobile readability improves
- preserve visual consistency across listing screens

---

## 12. Empty States, Loading States, and Error States

Every page and major module must support these states.

### 12.1 Empty States

Empty states should:

- explain what is missing
- tell the user what to do next
- avoid being overly verbose
- include a relevant action when possible

### 12.2 Loading States

Use:

- skeleton loaders
- shimmer placeholders
- button loading states
- disabled interactions during action in progress

### 12.3 Error States

Errors should:

- be visible
- be specific
- not break layout
- guide the user toward recovery

### 12.4 Success States

Success should be:

- clear
- short
- reassuring
- visible without being noisy

---

## 13. Forms and Validation Rules

### 13.1 Form Architecture

Use a reusable form architecture.

Recommended pattern:

- reusable field wrapper
- label
- input
- helper text
- error text
- optional right-side addon
- grouped sections

### 13.2 Validation UX

Validation should:

- appear inline
- avoid overwhelming the user
- explain what to fix
- use consistent error styling across the app

### 13.3 Numeric Inputs

For money, quantity, and stock:

- keep labels precise
- prevent ambiguous formatting
- align numbers carefully
- show currency consistently

### 13.4 Search Inputs

Search inputs should:

- feel instant
- be easy to clear
- use debounce only if it improves performance or UX
- preserve query visibility

---

## 14. Reusability Strategy

### 14.1 Shared UI Primitives

Build once, reuse everywhere.

Examples:

- Button
- Input
- Textarea
- Select
- Checkbox
- RadioGroup
- Dialog
- Drawer
- Badge
- Card
- Table
- Tabs
- Separator
- Tooltip
- Popover
- Skeleton
- Toast
- Spinner

### 14.2 Shared Business Components

Examples:

- SearchBar
- PageHeader
- SectionHeading
- StatCard
- MoneyValue
- QuantityControl
- FilterPills
- StatusPill
- EmptyState
- ActionToolbar
- ConfirmationDialog

### 14.3 Feature Components

Examples:

- BillingProductSearch
- BillingCartItems
- BillingSummaryPanel
- ProductForm
- InvoiceFilters
- InvoiceItemTable
- DeficitResolutionPanel

### 14.4 Reuse Rules

Before creating a new component, ask:

- does an existing component already solve this?
- can this be a variant instead?
- can this be a prop configuration instead?
- can this be a shared wrapper instead?

If yes, reuse rather than duplicate.

---

## 15. Mock Data Rules

Since no backend is required, the UI must still feel complete.

### 15.1 Create Mock Data that Matches the PRD

Mock data should include:

- tenant/business metadata
- outlet metadata
- products
- stock
- invoices
- deficit records
- onboarding states
- settings states

### 15.2 Mock Data Organization

Keep mock data in dedicated files, such as:

- `lib/mock-data/products.ts`
- `lib/mock-data/invoices.ts`
- `lib/mock-data/deficits.ts`
- `lib/mock-data/settings.ts`

### 15.3 Mock Data Quality

Mock data should:

- feel realistic
- cover edge cases
- include empty states
- include warning states
- include deleted products
- include resolved and pending deficits
- include GST and non-GST invoices
- include varying stock levels

### 15.4 No Hardcoding in Components

Do not scatter mock records directly inside UI components.  
Import them from the mock-data layer or pass them in from route pages.

---

## 16. Utility and Formatting Rules

Centralize reusable logic for display formatting.

Examples:

- currency formatting
- date formatting
- quantity formatting
- initials generation
- status label mapping
- route label mapping
- abbreviation display
- invoice number formatting

Keep utilities pure and testable.

---

## 17. Route and File Naming Rules

### Route Files

- use Next.js route conventions exactly
- keep route files simple
- route file should import a feature component and render it

### Component Files

- use kebab-case filenames
- use PascalCase for exported component names

### Utility Files

- use descriptive names
- keep file names aligned to purpose

### Type Files

- keep shared types separated by domain
- avoid one massive type file if the project grows

---

## 18. Accessibility Rules

Accessibility is mandatory.

Every meaningful UI element should support:

- keyboard navigation
- visible focus states
- accessible labels
- semantic HTML
- sensible aria attributes where needed

Specific requirements:

- buttons must not rely on color alone
- form fields must have labels
- icons used as actions must have accessible text
- dialogs must trap focus properly
- mobile drawers must remain keyboard-friendly

---

## 19. Responsive Design Rules

The app must work well across:

- desktop
- laptop
- tablet
- mobile

### 19.1 Desktop

Desktop is the primary workspace for billing and administration.

### 19.2 Tablet

Tablet should preserve productivity and not feel broken or cramped.

### 19.3 Mobile

Mobile should prioritize:

- readability
- touch targets
- stacked layout
- simplified navigation
- clear action hierarchy

### 19.4 Billing Screen Responsiveness

Billing should be responsive without losing clarity:

- search remains obvious
- cart remains usable
- summary remains visible or accessible
- finalization stays easy to reach

---

## 20. Motion and Animation Rules

Use motion sparingly and meaningfully.

### Use Motion For:

- opening and closing modals
- drawer transitions
- filter expansion
- subtle card hover
- button press feedback
- loading transitions
- small state changes

### Do Not Use Motion For:

- decorative loops
- exaggerated easing
- constant attention-grabbing movement
- large page transitions that slow the app down

Motion must help the user understand the interface, not distract them.

---

## 21. Code Quality Rules

### 21.1 Readability

Code should be easy to read without needing explanation.

### 21.2 No Giant Files

If a file grows too much, split it.

### 21.3 No Overengineering

Do not create abstractions that are not needed yet.

### 21.4 No Dead Code

Remove:

- unused components
- unused imports
- unused constants
- commented-out experiments

### 21.5 Consistent Patterns

Use the same architecture patterns across pages and feature modules.

### 21.6 Type Safety

Use TypeScript properly.

- no `any` unless truly unavoidable
- use explicit props
- use shared domain types
- keep component contracts clear

---

## 22. Recommended Implementation Patterns

### 22.1 Page Composition Pattern

Each page should look like this:

```tsx
export default function Page() {
  return <FeatureScreen />;
}
```

Then `FeatureScreen` should compose smaller pieces.

### 22.2 Section Composition Pattern

A screen should be composed of:

- header
- content sections
- actions
- supporting states

### 22.3 Presentational vs Interactive Split

Prefer:

- server parent
- client child for interaction

Example:

- server page renders layout and data
- client search bar handles typing
- client modal handles decisions
- server content remains static and structured

---

## 23. What the AI Agent Must Avoid

Do not:

- make everything a client component
- add backend code
- add API route stubs unless strictly necessary for future placeholder architecture
- duplicate components across features
- hardcode layout in every page
- create inconsistent spacing and colors
- create unnecessary global state
- build over-engineered abstractions
- add animations that slow down the UI
- bury the primary actions
- ignore empty states and loading states
- create a design that feels like a generic template

---

## 24. Practical Build Order

The agent should build in this order:

1. design tokens and base layout
2. UI primitives
3. shared components
4. route layouts
5. auth pages
6. onboarding pages
7. dashboard shell
8. billing page
9. products pages
10. invoices pages
11. deficits page
12. settings page
13. mock data and state wiring
14. empty/loading/error states
15. final polish and responsiveness

This order keeps the foundation strong and reduces rework.

---

## 25. Quality Bar

The final frontend should look and feel like a real product, not a demo.

Before considering the build complete, verify:

- all pages exist
- all routes render
- all major states are represented
- all repeated UI has been extracted
- client components are minimal
- SSR is used wherever possible
- the app shell is consistent
- responsive behavior is acceptable
- the visual language is coherent
- the codebase is easy to navigate

---

## 26. Final Rule

When in doubt, choose:

- simpler over clever
- reusable over duplicated
- server-rendered over client-rendered
- composable over monolithic
- consistent over experimental
- clean over flashy
- maintainable over quick hacks

This frontend should be built to last.
