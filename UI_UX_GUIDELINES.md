# UI/UX Design Guidelines

This document outlines the design standards and best practices for our projects, based on the UI UX Pro Max skill.

## Recommended Design System

### Pattern: Hero-Centric + Social Proof
- **Conversion**: Emotion-driven with trust elements
- **CTA**: Above fold, repeated after testimonials
- **Sections**:
  1. Hero
  2. Services
  3. Testimonials
  4. Booking
  5. Contact

### Style: Soft UI Evolution
- **Keywords**: Soft shadows, subtle depth, calming, premium feel, organic shapes
- **Best For**: Wellness, beauty, lifestyle brands, premium services
- **Performance**: Excellent | Accessibility: WCAG AA

### Colors (Example Palette)
- **Primary**:    `#E8B4B8` (Soft Pink)
- **Secondary**:  `#A8D5BA` (Sage Green)
- **CTA**:        `#D4AF37` (Gold)
- **Background**: `#FFF5F5` (Warm White)
- **Text**:       `#2D3436` (Charcoal)
- **Notes**: Calming palette with gold accents for luxury feel

### Typography
- **Font Family**: Cormorant Garamond / Montserrat
- **Mood**: Elegant, calming, sophisticated
- **Best For**: Luxury brands, wellness, beauty, editorial

### Key Effects
- Soft shadows
- Smooth transitions (200-300ms)
- Gentle hover states

### Avoid (Anti-patterns)
- Bright neon colors
- Harsh animations
- Dark mode (unless specifically requested/appropriate)
- AI purple/pink gradients

### Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
