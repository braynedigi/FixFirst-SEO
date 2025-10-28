# Color Scheme Update - Sea Blue Theme

## Overview
Updated the entire application to use a vibrant black and sea blue color scheme with green accents, creating a modern ocean-tech aesthetic.

## Color Palette

### Primary Colors
- **Cyan/Sea Blue**: `#06b6d4` (primary), `#0891b2` (dark), `#22d3ee` (light)
- **Sky Blue**: `#0ea5e9` (secondary), `#0284c7` (dark), `#38bdf8` (light)
- **Teal/Accent**: `#14b8a6` (accent), `#0d9488` (dark), `#2dd4bf` (light)
- **Success Green**: `#10b981` (kept from original)
- **Warning Yellow**: `#fbbf24` (brightened)
- **Error Red**: `#ef4444` (kept from original)

### Background Colors
- **Pure Black**: `#000000` (base)
- **Dark Blue-Black**: `#0a0f1a` (secondary)
- **Card Background**: `#0f1419` with gradient overlays

### Border Colors
- **Default**: `#1a2332` (dark blue-tinted)
- **Hover**: `#2a3f5f` (lighter blue-tinted)

### Text Colors
- **Primary**: `#f0f9ff` (very light blue-white)
- **Secondary**: `#94a3b8` (slate gray)

## Visual Enhancements

### Gradients
1. **Background**: Linear gradient from black to dark blue (`135deg, #000000 → #0a0f1a → #000814`)
2. **Headers**: Gradient text from cyan to teal to green (`primary → accent → success`)
3. **Buttons**: Gradient from cyan to darker cyan with glow effects
4. **Cards**: Subtle gradient backgrounds with cyan shadow glows

### Glow Effects
- **Scrollbar**: Cyan gradient with enhanced hover glow
- **Buttons**: Cyan shadow (`rgba(6, 182, 212, 0.4)`) that intensifies on hover
- **Cards**: Soft cyan border glow on hover
- **Icons**: Drop-shadow effects on checkmarks and icons
- **Input Fields**: Cyan glow on focus
- **Badges**: Category-specific glows (success green, warning yellow, info cyan)

### Component Updates

#### Landing Page
- **Logo**: Gradient icon with cyan glow, gradient text
- **Hero Title**: Gradient from cyan to teal to green
- **Section Headers**: All major headers use gradient text
- **Feature Cards**: Gradient icon backgrounds with borders and glows
- **Step Numbers**: Gradient circular backgrounds with borders
- **Pricing Cards**: Gradient titles and "Most Popular" badge
- **Stat Cards**: Gradient numbers with subtle glow
- **Benefit Cards**: Gradient titles and glowing emojis

#### Dashboard
- **Sidebar Logo**: Gradient text effect
- **Dashboard Title**: Gradient text
- **Stats Cards**: Enhanced with gradient borders and glows

#### Auth Pages
- **Login/Register Titles**: Gradient text for modern look

#### Global Components
- **Cards**: 
  - Gradient backgrounds with transparency
  - Cyan border glow on hover
  - Soft shadow with cyan tint
  - Lift effect on hover
  
- **Buttons**:
  - Primary: Cyan gradient with strong glow
  - Secondary: Transparent with cyan border that glows on hover
  
- **Input Fields**:
  - Cyan-tinted border
  - Cyan glow ring on focus
  - Semi-transparent dark background
  
- **Badges**:
  - Enhanced opacity (20% background)
  - Stronger borders (40% opacity)
  - Category-specific glows

- **Scrollbar**:
  - Cyan gradient thumb
  - Smooth hover transitions

## Technical Implementation

### Files Modified
1. `apps/web/tailwind.config.ts` - Color palette definitions
2. `apps/web/app/globals.css` - Global styles, component classes
3. `apps/web/app/page.tsx` - Landing page components
4. `apps/web/app/dashboard/page.tsx` - Dashboard branding
5. `apps/web/app/auth/login/page.tsx` - Login page
6. `apps/web/app/auth/register/page.tsx` - Register page

### New Tailwind Colors
```typescript
colors: {
  background: { DEFAULT: '#000000', secondary: '#0a0f1a', card: '#0f1419' },
  border: { DEFAULT: '#1a2332', hover: '#2a3f5f' },
  primary: { DEFAULT: '#06b6d4', dark: '#0891b2', light: '#22d3ee' },
  secondary: { DEFAULT: '#0ea5e9', dark: '#0284c7', light: '#38bdf8' },
  accent: { DEFAULT: '#14b8a6', dark: '#0d9488', light: '#2dd4bf' },
  success: '#10b981',
  warning: '#fbbf24',
  error: '#ef4444',
  text: { primary: '#f0f9ff', secondary: '#94a3b8' }
}
```

## Key Design Principles

1. **Black Foundation**: Pure black base with subtle blue-tinted dark backgrounds
2. **Sea Blue Dominance**: Cyan/teal as primary brand colors throughout
3. **Green Accents**: Success states and positive indicators use vibrant green
4. **Gradient Emphasis**: Major text elements use cyan-to-teal-to-green gradients
5. **Glow Effects**: Soft glows enhance interactivity and depth
6. **High Contrast**: Bright text on dark backgrounds for readability
7. **Layered Depth**: Cards and components use subtle transparency and shadows

## Result
A modern, vibrant, and professional interface with a distinctive ocean-tech aesthetic. The black and sea blue color scheme creates strong visual hierarchy while maintaining excellent readability. The green accents add vitality without overwhelming the design.

