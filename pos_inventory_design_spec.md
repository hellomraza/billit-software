# POS + Inventory SaaS — Design System & Product Experience Spec

**Purpose:** This document translates the MVP 1 PRD into a design-first build guide for the AI agent. It defines the visual language, page structure, navigation, motion, and interface behavior so the app feels coherent, fast, trustworthy, and retail-friendly from the first screen onward.

**Source of truth:** The product behavior, screens, and business rules come from the MVP 1 PRD. This document does not change product logic; it only defines how the app should look, feel, and be experienced.

---

## 1. Design Philosophy

The app should feel like a **modern retail control center**: calm, efficient, reliable, and businesslike. It is not a playful consumer app. It is a tool used for speed, clarity, and confidence during daily billing.

The experience should communicate four things immediately:

1. **Speed** — the user should feel that common tasks are one or two actions away.
2. **Trust** — numbers, totals, stock, and invoice records should feel dependable and precise.
3. **Clarity** — the interface should never make the user hunt for the next step.
4. **Control** — the user should always understand what is editable, what is locked, what is saved, and what is final.

The visual style should balance a **premium SaaS feel** with **practical retail utility**. It should not look overly corporate, overly playful, or visually noisy.

---

## 2. Brand Personality

The product personality should feel:

- **Confident**
- **Clean**
- **Efficient**
- **Stable**
- **Friendly but serious**
- **Operationally focused**

The app should feel like a system a shopkeeper can rely on every day. It should avoid decorative clutter, excessive gradients, or gimmicky motion. Subtle polish is good. Flashy styling is not.

---

## 3. Overall Visual Direction

The visual system should use:

- Soft neutral surfaces
- One strong brand color for primary actions
- Clear semantic colors for success, warning, and danger
- Rounded but not cartoonish corners
- Comfortable spacing
- Strong readability
- Dense but organized information layouts

The design should favor **structured cards, compact data rows, and clean panels**. Since this is a POS and inventory product, the UI must handle a lot of information without becoming cramped.

The page composition should follow this rule:

> Important actions stay visible, important numbers stay readable, and important states stay unmistakable.

---

## 4. Color System

The palette should feel modern and trustworthy. The app should work well in both light and dark themes, but the default presentation should be polished and neutral.

### 4.1 Primary Brand Color

Use a deep blue as the main brand color. Blue is a strong fit for finance, inventory, trust, and operational dashboards.

Recommended primary family:
- **Primary 600:** `#2563EB`
- **Primary 700:** `#1D4ED8`
- **Primary 100:** `#DBEAFE`

Primary color usage:
- Main CTA buttons
- Active nav states
- Toggle accents
- Selected tabs
- Focus outlines
- Links and interactive highlights

### 4.2 Secondary Accent

Use a teal or cyan accent sparingly for supportive highlights, progress, or subtle emphasis.

Recommended accent family:
- **Accent 600:** `#0EA5A4`
- **Accent 100:** `#CCFBF1`

Accent color usage:
- Positive progress moments
- Secondary badges
- Supportive highlights in charts or summaries
- Small UI flourishes only

### 4.3 Semantic Colors

The app must use semantic colors consistently and never interchange them casually.

Success:
- **Success 600:** `#16A34A`
- **Success 100:** `#DCFCE7`

Warning:
- **Warning 600:** `#D97706`
- **Warning 100:** `#FEF3C7`

Danger:
- **Danger 600:** `#DC2626`
- **Danger 100:** `#FEE2E2`

Info:
- **Info 600:** `#0284C7`
- **Info 100:** `#E0F2FE`

Usage:
- Success for completed actions, resolved deficits, valid states
- Warning for low stock, pending attention, near-threshold deficits
- Danger for blocked actions, errors, destructive actions
- Info for neutral explanatory messages and hints

### 4.4 Neutral Scale

The neutral palette should be soft and balanced with enough contrast for dense data.

Suggested neutrals:
- **Background:** `#F8FAFC`
- **Surface:** `#FFFFFF`
- **Surface Alt:** `#F1F5F9`
- **Border:** `#E2E8F0`
- **Text Primary:** `#0F172A`
- **Text Secondary:** `#475569`
- **Text Muted:** `#94A3B8`

For dark mode:
- **Background:** `#0B1220`
- **Surface:** `#111827`
- **Surface Alt:** `#1F2937`
- **Border:** `#334155`
- **Text Primary:** `#F8FAFC`
- **Text Secondary:** `#CBD5E1`
- **Text Muted:** `#94A3B8`

### 4.5 Color Usage Rules

- Do not use more than one strong color in a single small UI area unless the meaning is important.
- Use color to communicate status, not decoration.
- Keep most large surfaces neutral.
- Reserve primary color for actions that matter.
- Use warning and danger colors only when a user needs to notice something.

---

## 5. Typography

Typography should prioritize clarity and density.

### 5.1 Font Style

Use a modern sans-serif style that feels clean and highly readable. The type system should support fast scanning of numbers, labels, and table data.

Suggested hierarchy:
- **Page title:** bold, compact, confident
- **Section title:** medium-bold
- **Card heading:** semibold
- **Body text:** regular
- **Supporting text:** smaller, muted
- **Numeric values:** slightly stronger weight for visibility

### 5.2 Text Behavior

- Invoice numbers, totals, stock counts, and quantities should be visually prominent.
- Labels should be concise and informative.
- Helper text should be short and unobtrusive.
- Error text should be direct and readable.
- Avoid long paragraphs inside tables or forms.

### 5.3 Number Styling

All monetary values should feel exact and stable.
- Use consistent currency formatting.
- Align numbers consistently in tables whenever possible.
- Keep decimals visually calm and not over-emphasized.

---

## 6. Shape, Spacing, and Surface Style

### 6.1 Corner Radius

The app should use rounded corners with restraint.

Recommended styling:
- Buttons: medium rounding
- Cards and panels: larger rounding
- Inputs: medium rounding
- Tables: minimal rounding on container only
- Badges: pill-like rounding

The feel should be polished and modern, not bubbly.

### 6.2 Shadows

Use soft shadows only where depth helps hierarchy.

- Cards: subtle shadow
- Floating action areas or drawers: slightly stronger shadow
- Modals: clear separation from background
- Avoid heavy, dark, dramatic shadows

### 6.3 Spacing

Spacing should create calm structure.
- Tight spacing for data-heavy rows
- Comfortable spacing for forms and panels
- Extra breathing room for onboarding and empty states

Use a consistent rhythm so the app feels intentional and not assembled from unrelated parts.

---

## 7. Layout Principles

### 7.1 Desktop Layout

Desktop is the primary operational experience.

The layout should support:
- Fast billing
- Quick product lookup
- Easy sidebar summaries
- Visible controls without scrolling too much

Recommended layout patterns:
- Top navigation bar
- Left sidebar for primary section navigation
- Content area with cards, tables, and panels
- Right-side summary panel on task-heavy screens such as billing

### 7.2 Tablet Layout

Tablet should preserve the core structure but compress the navigation.
- Sidebar may collapse into icons or a drawer
- Billing interface should remain efficient
- Tables should become horizontally scrollable when needed

### 7.3 Mobile Layout

Mobile should still be usable, but the product is not mobile-first.
- Navigation becomes bottom sheet or drawer based
- Cards stack vertically
- Tables become compact list rows
- Billing actions should remain obvious and reachable
- Primary actions should stay pinned where possible

### 7.4 Content Density Rule

The app should be denser than a consumer dashboard, but never cramped. This is especially important for:
- Products
- Invoices
- Deficit management
- Billing summary

---

## 8. Navigation Philosophy

The navigation should reduce cognitive load. The user should always know:
- Where they are
- What section they are in
- What is primary
- What is locked or final

### 8.1 Main Navigation Groups

The app should use a simple, stable navigation model:

**Core sections**
- Billing
- Products
- Invoices
- Deficits
- Settings

**Authentication and setup**
- Login
- Signup
- Forgot password
- Reset password
- Onboarding steps

### 8.2 Navigation Hierarchy

Billing is the default home. Everything else supports billing.

Suggested primary order:
1. Billing
2. Products
3. Invoices
4. Deficits
5. Settings

This order reflects user frequency and importance.

### 8.3 Active State Design

The active nav item should be obvious:
- Strong color indicator
- Slight background tint
- Clear icon contrast
- Optional left border or underline

### 8.4 Secondary Navigation

Some sections need internal navigation:
- Products: list, add, edit, import
- Invoices: list, detail
- Onboarding: business, outlet, GST

The secondary navigation should be simple and step-based rather than cluttered with tabs.

---

## 9. Motion and Animation Philosophy

Motion should feel purposeful, not decorative.

Animations should help users understand:
- what changed
- what expanded
- what was saved
- what is loading
- what needs attention

### 9.1 Motion Rules

- Keep transitions short and crisp
- Avoid springy or playful animations
- Prefer subtle fades, slides, and scale reveals
- Use animation to guide attention, not to entertain

### 9.2 Where to Use Motion

Use motion in these places:
- Page transitions
- Sidebar and drawer open/close
- Modal appearance
- Dropdowns and popovers
- Toast notifications
- Cart item add/remove
- Stock warning transitions
- Deficit expand/collapse
- Row expansion in tables
- Loading states and skeletons

### 9.3 Suggested Motion Feel

- Page entrance: subtle fade + small upward movement
- Modal: scale in gently with backdrop fade
- Drawer: slide from edge
- Buttons: light press feedback
- Success toasts: quick settle animation
- Error states: minimal shake only when necessary

### 9.4 Important Motion Rule

Do not animate core numbers in a way that makes them hard to read. Totals, stock counts, and invoice values should remain stable and legible.

---

## 10. Global UI Components

The app should be built from a consistent set of reusable UI patterns.

### 10.1 Buttons

Button hierarchy:
- Primary button: main action
- Secondary button: supportive action
- Tertiary button: quiet action
- Destructive button: dangerous action

Primary buttons should use the brand color. Destructive buttons should use danger styling only for irreversible actions.

### 10.2 Inputs

Inputs should be clean, generous, and readable.
- Labels above fields
- Helper text below fields
- Error text directly under field
- Clear focus state
- No cluttered borders

### 10.3 Badges

Badges should communicate status quickly:
- Active
- Deleted
- GST Invoice
- Non-GST Invoice
- Pending
- Resolved
- Warning
- Locked

Badges should be compact and color-coded with restraint.

### 10.4 Cards

Cards should group related data:
- Summary cards
- Product cards
- Invoice summary cards
- Deficit cards
- Onboarding step cards

Cards should be used heavily to create structure without feeling boxed in.

### 10.5 Tables and Lists

Tables are essential in this app. They should be:
- Easy to scan
- Dense but readable
- Clearly sortable where allowed
- Compact with strong row separation

On smaller screens, tables may convert into stacked rows with key-value pairs.

### 10.6 Modals and Drawers

Use modals for:
- confirmations
- insufficiency resolution
- destructive actions
- short decision flows

Use drawers for:
- detailed review on narrower screens
- edit side panels where a full page is not needed

### 10.7 Empty States

Empty states should be helpful, not emotional.
They should always answer:
- what is missing
- what the user can do next

---

## 11. Page-by-Page Design Spec

## 11.1 Login Page

### Goal
Allow the user to re-enter the system quickly and confidently.

### Layout
- Centered auth card
- App mark and name at top
- Email and password inputs
- Primary login button
- Forgot password link
- Small signup prompt

### Feel
- Clean
- Calm
- Trustworthy
- Minimal distraction

### Content
- Clear headline
- Short supportive subtitle
- Error messaging placed close to fields
- Password visibility toggle
- Loading state on submit

### Motion
- Card fades in gently
- Errors appear inline without jarring movement

---

## 11.2 Signup Page

### Goal
Create a new tenant account with minimal friction.

### Layout
- Same visual style as login
- Slightly more guided than login
- Two fields only: email and password

### Content
- Clear explanation that this is the account creation step
- Password rules shown before submission
- Inline validation
- Success state should transition directly into onboarding

### Feel
- Fast
- Straightforward
- Reassuring

---

## 11.3 Forgot Password Page

### Goal
Help the user request a reset link without exposing account existence.

### Layout
- Centered form card
- One email field
- One submit button
- Supportive copy about receiving a reset link

### Content
- Message should feel neutral and secure
- Confirmation state should be calm and informative

### Motion
- Minimal; just enough to show state change

---

## 11.4 Reset Password Page

### Goal
Let the user set a new password safely.

### Layout
- Centered form card
- New password and confirm password fields
- Validation instructions
- Single strong submit action

### Content
- Clear instruction that the link may expire
- Simple invalid-link state
- Strong success confirmation before redirect

---

## 11.5 Onboarding Flow

Onboarding is a guided setup sequence. It should feel like a friendly setup wizard, not a form dump.

### Structure
- Step-based layout
- Strong progress indicator
- One focus per screen
- Big primary action on each step

### Step 1: Business Name
This screen should establish identity.

Should contain:
- Business name input
- Auto-generated abbreviation preview
- Editable abbreviation field
- Clear explanation of what the abbreviation is used for
- Continue button

Feel:
- First impression
- Trust-building
- Simple and elegant

### Step 2: Outlet Name
This screen should feel like naming the physical operating location.

Should contain:
- Outlet name input
- Suggested default value already filled
- Generated abbreviation preview
- Editable abbreviation field
- Continue button

Feel:
- Slightly more operational than the business step
- Still guided and simple

### Step 3: GST
This screen should feel optional and low pressure.

Should contain:
- GST number input
- Helpful note that it can be updated later
- Validation hint if format looks wrong
- Finish setup button

Feel:
- Optional
- Softly informative
- No visual pressure

### Motion
- Step transitions should slide softly
- Progress indicator should update smoothly
- Inputs should focus automatically on the first field

---

## 11.6 Billing Screen

This is the most important screen in the app. It should feel like the operational heart of the product.

### Goal
Create invoices quickly, view stock clearly, and minimize errors.

### Layout
The billing screen should use a two-column layout on desktop:

**Left side**
- Product search
- Search results
- Cart items
- Stock indicators

**Right side**
- Invoice summary
- Customer details
- Payment method
- GST state
- Finalize action
- Clear bill action

### What the screen should communicate
- This is the main workflow
- The user is in control
- Stock state is visible
- Totals are trustworthy
- Finalization is a meaningful step

### Content Requirements

#### Header Area
Should include:
- Page title: Billing
- GST toggle in the top bar
- Refresh stock button
- Quick links to products, invoices, deficits, settings

#### Product Search
Should feel fast and accessible:
- Large search input
- Search results appear immediately
- Results show name, price, stock
- Deleted products excluded
- Add action is one click

#### Cart Area
Each cart line should show:
- Product name
- Unit price
- Quantity controls
- Line total
- Remove action

Cart items should be visually separated but compact. Quantity controls should be unmistakable.

#### Summary Panel
Should clearly show:
- Subtotal
- GST amount when enabled
- Grand total
- Payment method status
- Finalize button
- Clear bill button

### States
The billing screen must support:
- Empty cart state
- Stock visible state
- Stock stale state
- Payment method not selected state
- Finalize loading state
- Success state
- Insufficient stock state

### Feel
- Fast
- Reliable
- Slightly dense
- Very clear
- Never chaotic

### Motion
- Adding an item should feel instant
- Quantity changes should update smoothly
- Summary values may animate subtly but never in a distracting way
- Finalized success should feel conclusive

---

## 11.7 Insufficient Stock Modal

This modal is one of the most important decision surfaces in the app.

### Goal
Help the user decide what to do when stock is not enough.

### Visual Style
- Strong heading
- Clear product-level sections
- Warning color used carefully
- Decision buttons grouped consistently

### Content
For each insufficient item, show:
- Product name
- Requested quantity
- Available quantity
- Explanation of the choices

### Decision Design
Each item should present three clear actions:
- Use available quantity
- Sell anyway
- Remove from bill

The override option should feel visibly risky and should be clearly blocked when needed.

### Feel
- Serious
- Clear
- Controlled
- No alarmism

### Motion
- Modal appears with a firm but gentle transition
- Attention should go to the first insufficient item
- Disabled override states should be obvious but not noisy

---

## 11.8 Products Page

### Goal
Provide a clear product catalog with management controls.

### Layout
- Page header with title and actions
- Search and filter controls
- Add product button
- Import CSV button
- Full list table or dense card list

### Content
Each product row should show:
- Name
- Price
- GST rate
- Current stock
- Status
- Action buttons

### Feel
- Structured
- Manageable
- Data-forward
- Efficient

### Visual Design
- Stock values should stand out
- Deleted status should be muted but visible
- Warning states should be easily noticeable
- Active rows should remain visually calm

### Motion
- Search filtering should feel immediate
- Row actions should appear on hover or remain visible on smaller screens
- Soft transition when switching deleted visibility

---

## 11.9 Add Product Page

### Goal
Let the user create a product with confidence and without confusion.

### Layout
- Form-first page
- Strong section grouping
- Clear save action
- Supporting explanatory text

### Content
Fields should be organized as:
- Product identity
- Pricing and tax
- Stock setup
- Threshold behavior

### Feel
- Deliberate
- Quietly authoritative
- Minimal distraction

### Design Notes
- Opening stock should be visually separated from price
- Deficit threshold should be explained in simple language
- Duplicate name allowance should not feel like an error condition

---

## 11.10 Edit Product Page

### Goal
Let the user modify product details while preserving trust in historical invoices.

### Layout
Similar to Add Product, but with more visual emphasis on what is safe to change.

### Content
Should clearly indicate:
- Which fields affect future invoices only
- Which fields are still editable
- Which fields are not part of stock updates

### Feel
- Familiar
- Precise
- Reassuring

### Special Visual Rule
Any text that explains invoice snapshots should be presented softly, but clearly. The user should understand that old invoices do not change.

---

## 11.11 CSV Import Page

### Goal
Make bulk product creation feel simple and safe.

### Layout
- Upload area
- Template download action
- Validation rules summary
- Import results panel

### Content
Should include:
- Accepted file type
- File size limit
- Row limit
- Sample template guidance
- Error report after import

### Feel
- Practical
- Slightly technical, but still easy
- Focused on success and correction

### Motion
- Upload progress should be obvious
- Result summary should appear cleanly
- Error rows should expand or display in a readable list

---

## 11.12 Invoices Page

### Goal
Give the user a searchable record of sales.

### Layout
- Filter bar at the top
- Invoice list below
- Pagination controls at the bottom

### Content
Each row should show:
- Invoice number
- Date and time
- Customer name
- Grand total
- Payment method badge
- GST badge when applicable

### Feel
- Orderly
- Archive-like
- Professional
- Easy to scan

### Design Rules
- Use rows with strong alignment
- Keep filter controls compact but readable
- Show only essential details in the list
- Make invoice number and total visually important

### Motion
- Filter changes should update smoothly
- Pagination should not feel jumpy

---

## 11.13 Invoice Detail Page

### Goal
Present a single invoice as a formal, readable record.

### Layout
- Summary header at top
- Invoice identity panel
- Customer information block
- Itemized table
- Totals panel
- GST label badge

### Content
Should display:
- Invoice number
- Date and time
- Business identity
- Customer details
- Payment method
- Item snapshots
- Totals

### Feel
- Official
- Clean
- Final
- Reliable

### Visual Tone
This page should feel like a finalized record. There should be no edit affordances. No accidental action buttons. No confusion about permanence.

---

## 11.14 Deficits Page

### Goal
Surface stock problems clearly and help the user resolve them deliberately.

### Layout
- Top summary explaining what deficits mean
- List of product-level deficit groups
- Expandable details per product
- Resolution actions

### Content
Each product block should show:
- Product name
- Pending total
- Record count
- Most recent deficit date
- Threshold status
- Warning badge if near limit

### Feel
- Operational
- Alerting but calm
- Action-oriented

### Visual Hierarchy
- Near-threshold items should stand out
- Pending totals should be prominent
- Oldest and newest record details should be readable
- Expanded details should feel orderly

### Motion
- Expand/collapse should be smooth
- Resolution controls should appear contextually
- Completed resolution should feel like a state change, not just a form submit

---

## 11.15 Settings Page

### Goal
Provide account and business controls in a calm, organized structure.

### Layout
Use stacked sections or cards:
- Business information
- GST
- Account
- Logout

### Content
Should clearly distinguish:
- read-only business identifiers
- editable GST data
- password update controls

### Feel
- Administrative
- Safe
- Clean
- Not overly busy

### Important Rule
Locked abbreviation fields should look intentionally read-only. They should not appear disabled in a broken way. They should appear stable and final.

---

## 12. Empty States

Empty states should be practical and helpful.

### Billing Empty State
- Encourage the user to search products
- Explain that the bill will appear here as items are added

### Products Empty State
- Encourage creating the first product or importing CSV
- Make creation feel like the natural next step

### Invoices Empty State
- Explain that no invoices exist yet
- Suggest creating the first bill

### Deficits Empty State
- Explain that there are no pending stock deficits
- Reinforce that stock is currently healthy

### Settings Empty State
Settings should never feel empty because it is mostly data-driven.

---

## 13. Feedback Patterns

### Success Feedback
- Use gentle success toast
- Keep it short
- Confirm the action clearly
- Do not over-celebrate simple actions

### Error Feedback
- Inline when tied to a field
- Toast or banner when tied to a general action
- Always explain the issue in plain language

### Warning Feedback
- Use warning color only when attention is needed
- Keep warning text concise
- Avoid making every minor issue look severe

### Loading Feedback
- Use skeletons where useful
- Disable buttons while requests are in progress
- Make loading states feel deliberate, not frozen

---

## 14. Interaction Rules

### General
- Buttons should respond instantly to hover and press
- Focus states must be visible
- Disabled states must be clearly non-interactive
- Keyboard navigation should feel natural
- Important actions should ask for confirmation when destructive

### Billing
- Search should be fast and forgiving
- Adding a product should be immediate
- Quantity controls should be easy to tap
- Finalize should be visually dominant only when the bill is valid

### Tables
- Rows should have generous clickable areas
- Actions should be easy to discover
- Row hover should gently lift or tint, not jump

---

## 15. Responsive Behavior

### Desktop
- Full control surface
- Best for daily operations
- Sidebars and tables fully visible

### Tablet
- Preserve structure
- Reduce density slightly
- Keep billing efficient

### Mobile
- Single-column stacking
- Navigation drawer or bottom navigation
- Sticky primary action where appropriate
- Cards replace wide tables when needed

The mobile experience should still feel deliberate, not squeezed.

---

## 16. Accessibility Expectations

The app should be readable and usable for long work sessions.

Requirements:
- Strong contrast
- Clear focus rings
- Legible type sizes
- No color-only meaning where text is needed
- Touch targets large enough for fast retail use
- Clear labels for icons and actions
- Error messages close to the relevant control

---

## 17. Content Tone

The interface copy should sound:
- Direct
- Helpful
- Respectful
- Human
- Non-technical unless necessary

The copy should avoid unnecessary jargon. It should help the user complete a task, not sound like a system manual.

Examples of good tone:
- “Add Product”
- “Resolve — Stock received”
- “This product has unresolved deficits”
- “Finish Setup”
- “Finalize Invoice”

The tone should stay consistent throughout the app.

---

## 18. Design Principles for the AI Agent

When building the app, the AI agent should follow these rules:

1. Every page should feel part of the same product family.
2. Use visual hierarchy to make primary actions obvious.
3. Keep billing the most polished and efficient screen.
4. Never make a final state look editable.
5. Treat stock, totals, and invoice numbers as high-trust data.
6. Use motion sparingly and meaningfully.
7. Make warnings visible without making the app feel alarming.
8. Prefer clean organization over decorative complexity.
9. Use cards, sections, and rows to create rhythm.
10. Make the product feel like a reliable business tool, not a consumer app.

---

## 19. Suggested Screen Mood Summary

- **Auth screens:** calm and secure
- **Onboarding:** guided and reassuring
- **Billing:** fast and operational
- **Products:** structured and manageable
- **Invoices:** official and record-like
- **Deficits:** alerting but controlled
- **Settings:** quiet and administrative

---

## 20. Final Design Goal

The final app should feel like a premium retail operating system for a small business: visually clean, easy to scan, quick to use, and serious about correctness.

It should feel like the user is in a professional workspace where nothing is hidden, every number matters, and every action has a clear outcome.

---

## 21. Handoff Summary for the AI Builder

Build the interface as a cohesive retail SaaS product with:
- a calm blue-led visual identity,
- strong neutral surfaces,
- compact but readable data layouts,
- a clear left-to-right operational flow on desktop,
- step-based onboarding,
- an efficient billing experience,
- strong status feedback,
- restrained motion,
- and a consistent sense of trust and control.

Every screen should help the user move faster without making them feel rushed.

---

*End of Design System & Product Experience Spec*
