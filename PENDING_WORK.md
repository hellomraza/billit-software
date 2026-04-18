# BillIt MVP 1 — Implementation Checklist

**Last Updated**: April 16, 2026  
**Current Status**: 100% Complete (5/5 critical features done)  
**Build Contract Reference**: `frontend_build_contract_nextjs_16_2_3.md`

---

## 🔴 CRITICAL — Must Complete for MVP 1

These features are explicitly required by the frontend build contract and are currently missing or broken.

### Product Management

- [x] **Edit Product Page** — Section 10.11
  - [x] Create route file: `app/(dashboard)/products/[id]/edit/page.tsx`
  - [x] Implement product form pre-filled with existing data
  - [x] Add field labels explaining invoice snapshot behavior
  - [x] Fetch product data from mock/storage by ID
  - [x] Handle form submission and data persistence
  - [x] Show loading state during save
  - [x] Display success toast after save
  - [x] Redirect back to products list on success

### Billing Workspace

- [x] **Customer Details Section** — Section 10.8
  - [x] Add optional customer name input field
  - [x] Add optional customer phone input field
  - [x] Position above or alongside payment method section
  - [x] Persist customer details in invoice record
  - [x] Include in generated invoice JSON
  - [x] Display in invoice detail view

- [x] **GST Toggle in Top Navigation** — Section 10.8, Design Spec
  - [x] Add toggle button to billing page header
  - [x] Display current GST state (enabled/disabled)
  - [x] Update `tenantSettings.isGstEnabled` on toggle
  - [x] Recalculate grand total immediately
  - [x] Persist selection in localStorage or context
  - [x] Apply to all subsequent invoices

- [x] **Refresh Stock Button** — Section 10.8
  - [x] Add button to billing page header
  - [x] Show loading spinner while refreshing
  - [x] Simulate API call with 500ms delay
  - [x] Update product list after refresh
  - [x] Show success toast on completion
  - [x] Handle error state gracefully

- [x] **Stock Decrement After Billing** — Implicit in 10.8
  - [x] Reduce product stock by invoice quantities on finalize
  - [x] Update products array in storage
  - [x] Persist to localStorage for mock products
  - [x] Update imported products in storage
  - [x] Reflect changes immediately in next billing session
  - [x] Account for deficits sold at zero inventory

- [x] **Deficit Resolution Mechanics** — Section 10.15
  - [x] Implement "Acknowledge" action for deficit groups
  - [x] Implement "Restock" action to zero out deficit
  - [x] Update deficit status to "RESOLVED" on action
  - [x] Remove resolved deficits from primary view (optional)
  - [x] Show success toast with confirmation
  - [x] Persist resolution state to mock storage

---

## 🟠 HIGH PRIORITY — Expected in Professional Build

These features are mentioned in the build contract and should be completed for polish and functionality.

### Data Display & Loading States

- [x] **Skeleton Loaders for Tables** — Section 12.2
  - [x] Replace `animate-pulse` with structured Skeleton component in `data-table.tsx`
  - [x] Create skeleton that matches table row structure
  - [x] Use Skeleton for each column in loading state
  - [x] Apply to Products table loading
  - [x] Apply to Invoices table loading
  - [x] Apply to Deficits list loading
  - [x] Reference: `components/ui/skeleton.tsx` exists

- [x] **Proper Invoice Numbering** — Section 10.8
  - [x] Replace hardcoded "INV-2049" with sequential numbering
  - [x] Generate format: INV-001, INV-002, INV-003, etc.
  - [x] Store next invoice number in localStorage
  - [x] Increment on each successful finalization
  - [x] Show correct number in success toast
  - [x] Show in invoice detail and list views

- [x] **Button Loading States** — Design Spec General
  - [x] Add loading spinner to "Finalize Invoice" button
  - [x] Disable button during invoice processing
  - [x] Change button text to "Processing..." during load
  - [x] Show disabled state on "Delete Product" action
  - [x] Show disabled state on "Save Product" action
  - [x] Show disabled state on all form submissions

- [x] **Product Delete Loading State** — Section 10.9
  - [x] Add loading state to delete confirmation dialog
  - [x] Disable cancel button during deletion
  - [x] Show "Deleting..." in confirm button
  - [x] Animate state change to deleted
  - [x] Reflect immediately in product table

### Form & Validation

- [x] **Real-Time Field Validation** — Section 13.2
  - [x] Validate product name (min 3 chars) as user types
  - [x] Validate price (must be positive number) as user types
  - [x] Validate GST rate (0-100%) as user types
  - [x] Show inline error text under invalid fields
  - [x] Highlight invalid fields with error styling
  - [x] Clear error on next keystroke
  - [x] Disable submit button if form invalid

- [x] **Debounced Search Performance** — Section 13.4
  - [x] Optimize product search with debounce (300ms)
  - [x] Optimize invoice search with debounce
  - [x] Show loading indicator while searching
  - [x] Clear results on empty query

### Advanced Features

- [x] **Product Code/SKU Search** — Design Spec Section 11.8
  - [x] Add SKU/product code field to product form
  - [x] Make searchable in billing product search
  - [x] Search by code in products list
  - [x] Display code in search results

- [ ] **Business/Product History Tracking** — Implicit in 10.11
  - [x] Track when products are created/modified
  - [x] Store creation timestamp for each product
  - [x] Store modification timestamp for edits
  - [x] Display in product detail (optional UI)

---

## 🟡 MEDIUM PRIORITY — UX Refinement & Polish

These enhance the user experience but don't break functionality if missing.

### Responsive Design

- [x] **Mobile Billing Optimization** — Section 19.3-19.4
  - [x] Make billing layout stack vertically on mobile
  - [x] Collapse search results to drawer on small screens
  - [x] Stack cart items below search on mobile
  - [x] Make summary panel sticky or bottom-sheet on mobile
  - [x] Ensure finalize button remains accessible
  - [x] Test on phone-sized screens (max-width: 640px)

- [x] **Tablet Layout Refinement** — Section 19.2
  - [x] Sidebar collapses to icons on medium screens
  - [x] Billing panels adjust for tablet width
  - [x] Summary panel remains visible or floating
  - [x] Tables become horizontally scrollable if needed

### Abbreviation System

- [x] **Smart Abbreviation Generation** — Sections 10.5-10.6
  - [x] Handle multi-word names correctly
  - [x] Extract meaningful abbreviations (not just first letters)
  - [x] Remove common words (The, A, An, etc.)
  - [x] Handle special characters gracefully
  - [x] Generate 2-4 character codes intelligently
  - [x] Example: "Central Supermarket Limited" → "CSL" or "CSML"

### Email & Auth Flows

- [x] **Password Reset Email Flow** — Section 10.4
  - [x] Show email sending state with spinner
  - [x] Simulate email delivery with 1s delay
  - [x] Display "Email sent to [address]" confirmation
  - [x] Add ability to resend email
  - [x] Show expiration notice (token expires in 24h)

- [x] **Forgot Password Email Simulation** — Section 10.3
  - [x] Show "Sending reset link..." state
  - [x] Display success message after "send"
  - [x] Include safe phrasing (no "user not found")
  - [x] Suggest checking spam folder

### Animations & Transitions

- [x] **Page Section Reveal Animations** — Section 20
  - [x] Add fade-in + slide animations on page load
  - [x] Stagger animations for table rows
  - [x] Smooth transitions on filter changes
  - [x] Smooth transitions on modal open/close

- [x] **Deficit Expand/Collapse Animation** — Section 20
  - [x] Smooth expand animation for deficit details
  - [x] Rotate icon on expand/collapse
  - [x] Maintain smooth height transition

- [x] **Loading Skeleton Transitions** — Section 20
  - [x] Shimmer effect on skeleton loaders
  - [x] Smooth transition from skeleton to content
  - [x] Fade out skeleton as data loads

### Advanced Filters

- [x] **Product Search Enhancement** — Design Spec 11.8
  - [x] Search by name, code, or category
  - [x] Show search results with stock status
  - [x] Highlight matching text in results
  - [x] Support keyboard shortcuts (Alt+S for search)

- [x] **Invoice Filter Improvements** — Design Spec 11.12
  - [x] Add quick-filter pills (Today, This Week, This Month)
  - [x] Remember last filter selection
  - [x] Show filter count badge
  - [x] Add "Clear all filters" button

---

## 🔵 LOW PRIORITY — Polish & Edge Cases

Nice-to-have improvements that don't impact core functionality.

### Accessibility Enhancements

- [x] **Keyboard Navigation for Dropdowns** — Section 18
  - [x] Support arrow keys in payment method selection
  - [x] Support arrow keys in filter dropdowns
  - [x] Tab to focus payment method buttons
  - [x] Tab to focus filter controls

- [x] **Modal Focus Trapping** — Section 18
  - [x] Trap focus inside insufficient stock modal
  - [x] Trap focus inside confirmation dialogs
  - [x] Return focus to trigger on close
  - [x] Close modal with Escape key

- [x] **Screen Reader Announcements** — Section 18
  - [x] Announce invoice finalization success
  - [x] Announce deficit resolution
  - [x] Announce filter changes
  - [x] Use `aria-live` regions for state updates

### Print Optimization

- [x] **Custom Print Stylesheet** — Section 10.14
  - [x] Create `@media print` styles for invoice
  - [x] Hide navigation and action buttons
  - [x] Optimize layout for A4 page
  - [x] Show business details clearly
  - [x] Display all invoice items with spacing
  - [x] Include footer with terms/thank you

- [x] **Print Preview** — Design Spec 11.13
  - [x] Add "Preview" button before print
  - [x] Show how invoice will appear when printed
  - [x] Allow adjustments before printing

### Error Handling

- [ ] **Comprehensive Error States** — Section 12.3
  - [ ] Handle network errors gracefully
  - [ ] Show specific error messages (not generic)
  - [ ] Provide recovery actions
  - [ ] Log errors for debugging

- [ ] **Offline Support** — Not in contract but useful
  - [ ] Cache product data for offline use
  - [ ] Queue invoices when offline
  - [ ] Sync when connection restored

### Dark Mode Support

- [x] **Dark Mode Implementation** — Design Spec (future-proofing)
  - [x] Verify color palette in dark mode
  - [x] Add dark mode toggle in settings
  - [x] Persist preference in localStorage
  - [x] Apply system preference on first visit
  - [ ] Note: Not required for MVP 1, but mentioned in spec

---

## 📋 TESTING & VERIFICATION CHECKLIST

Before marking as complete, verify each feature with:

- [ ] **Unit Tests** — For validators, formatters, hooks
- [ ] **Integration Tests** — For page flows and data persistence
- [ ] **Manual Testing** — Test on desktop, tablet, mobile
- [ ] **Accessibility Testing** — Test with keyboard navigation
- [ ] **Browser Testing** — Chrome, Safari, Firefox, Edge
- [ ] **Performance Testing** — No janky animations, fast interactions
- [ ] **Data Persistence** — Check localStorage across sessions
- [ ] **Error Scenarios** — Test with invalid data, empty states
- [ ] **Edge Cases** — Test boundary conditions (0 stock, max quantities)

---

## 📊 PROGRESS TRACKING

Use this section to track overall progress:

### Critical Features (5 items)

- [x] Edit Product Page
- [x] Customer Details in Billing
- [x] GST Toggle
- [x] Refresh Stock Button
- [x] Stock Decrement & Deficit Logging

**Status**: 5/5 (100%)

### High Priority Features (7 items)

- [x] Skeleton Loaders
- [x] Invoice Numbering
- [x] Loading States
- [x] Real-Time Validation
- [x] Debounced Search
- [x] Product Code Search
- [x] History Tracking

**Status**: 7/7 (100%)

### Medium Priority Features (8 items)

- [x] Mobile Optimization
- [x] Tablet Layout
- [x] Smart Abbreviations
- [x] Email Flows
- [x] Animations
- [x] Advanced Filters
- [ ] Abbreviation Generation
- [ ] Deficit Animations

**Status**: 6/8 (75%)

### Low Priority Features (8 items)

- [ ] Keyboard Navigation
- [ ] Focus Trapping
- [ ] Screen Reader Support
- [ ] Print Stylesheet
- [ ] Error Handling
- [ ] Offline Support
- [ ] Dark Mode
- [ ] Additional Polish

**Status**: 0/8 (0%)

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: Critical Fixes (Week 1)

Complete the 5 critical features to make MVP 1 fully functional.

- Estimated effort: 12-15 hours
- After completion: MVP is feature-complete

### Phase 2: High Priority Polish (Week 2)

Add loading states, validation, and skeleton loaders.

- Estimated effort: 8-10 hours
- After completion: Professional-grade UX

### Phase 3: Medium Priority UX (Week 3)

Responsive design, animations, advanced filters.

- Estimated effort: 10-12 hours
- After completion: Polished across all devices

### Phase 4: Nice-to-Have (Ongoing)

Accessibility, dark mode, offline support.

- Estimated effort: 6-8 hours
- After completion: Enterprise-ready

---

## 📝 NOTES

- **Frontend Build Contract**: `/Users/mustafaraza/Desktop/billit-software/frontend_build_contract_nextjs_16_2_3.md`
- **Design Spec**: `/Users/mustafaraza/Desktop/billit-software/pos_inventory_design_spec.md`
- **Current Build Status**: ~78% complete (32/42 features + refinements)
- **Next Audit Date**: After completing Phase 1
- **Owner**: hellomraza/billit-software
- **Branch**: main

---

**Last Reviewed**: April 16, 2026  
**Maintained By**: Development Team
