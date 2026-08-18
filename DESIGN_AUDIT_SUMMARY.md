# DESIGN AUDIT SUMMARY - Toasty OS

## Overview
Initial audit of core layout and UI components reveals several areas needing attention to achieve premium, modern, and cohesive design.

## Key Findings

### 1. Color System & Theme
- Uses HSL color variables with good foundation
- Light/dark theme switching implemented
- Sidebar has custom color variables (--sidebar-bg, --sidebar-fg, etc.)
- Primary color: hsl(24.6 95% 53.1%) (orange-ish)
- Need to refine spacing, typography, and component styling

### 2. Layout Structure
- **AppShell**: Basic structure with collapsible sidebar and responsive topbar
- **Sidebar**: Fixed width (ml-64 when expanded), navigation grouped by function
- **Topbar**: Height h-14 (3.5rem), sticky, contains user/org/theme controls

### 3. Component Inconsistencies
- Button variants exist but need refinement for premium feel
- Navigation uses Lucide icons consistently
- Missing consistent spacing scale and typography hierarchy
- Cards and containers lack refined elevation/shadow treatment
- Form inputs need premium treatment

### 4. Typography
- Currently using utility classes (text-sm, etc.) without defined hierarchy
- Need to establish clear typographic scale:
  - Page title
  - Section title  
  - Card title
  - Metric/KPI
  - Label
  - Body
  - Helper text
  - Metadata

### 5. Spacing
- Arbitrary spacing values (p-6, p-4, px-4, etc.)
- Need defined spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)

### 6. Border Radius & Elevation
- Uses --radius: 0.5rem (8px) globally
- Need surface hierarchy with varying elevation and radius
- Cards, dialogs, popovers should have refined treatment

### 7. Specific Component Issues

**Sidebar:**
- Navigation items lack visual hierarchy
- No clear active state styling beyond text color
- Icons could use consistent sizing
- Group labels need better typographic treatment

**Topbar:**
- Height may be too tall for premium feel
- User info display could be more refined
- Action icons (theme, bell) need consistent sizing and spacing

### 8. Missing Premium Patterns
- Skeleton loading states for better perceived performance
- Refined empty states with illustration/icon + text
- Improved focus states and hover interactions
- Better visual feedback for interactive elements
- Consistent card/elevation treatment

## Priority Areas for Wave 1 (Design System + AppShell)

1. **Design System Foundation**
   - Refine spacing scale
   - Establish typography hierarchy
   - Define surface and elevation system
   - Refine color usage for premium feel
   - Improve border radius hierarchy

2. **AppShell Refinement**
   - Sidebar: Improved visual hierarchy, active states, group separation
   - Topbar: Optimized height, refined user/org display, better action grouping
   - Main container: Better content padding and max-width constraints

3. **UI Component Upgrades**
   - Button: Refined variants with better hover/active states
   - Card: Premium treatment with shadow and border refinement
   - Input: Improved focus states and styling
   - Badge: More sophisticated variants
   - Toast: Premium notification styling

This audit will guide the systematic redesign across all waves while maintaining functionality.