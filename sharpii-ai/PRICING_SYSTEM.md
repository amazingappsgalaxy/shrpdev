# Dynamic Pricing System Documentation

The new dynamic pricing system provides a flexible, configurable way to calculate credits for image enhancements based on model selection, image resolution, and user-selected options.

## Architecture Overview

The pricing system consists of several key components:

1. **PricingEngine** - Core calculation engine
2. **Resolution Tiers** - Base costs by image resolution
3. **Model Configurations** - Model-specific multipliers and fees
4. **Option Modifiers** - Dynamic pricing based on user settings
5. **Admin Interface** - GUI for configuration management

## Key Features

- ✅ **Model-Specific Pricing**: Different costs per AI model
- ✅ **Resolution-Based Tiers**: Costs scale with image resolution
- ✅ **Option-Based Modifiers**: Prices change based on user settings
- ✅ **Real-Time Calculation**: Prices update as users change options
- ✅ **Detailed Breakdown**: Users see exactly how costs are calculated
- ✅ **Admin Configuration**: Easy to modify pricing without code changes
- ✅ **Backward Compatibility**: Works with existing credit system

## Usage Examples

### Basic Price Calculation

```typescript
import { PricingEngine } from '@/lib/pricing-engine'

// Calculate credits for a standard HD image enhancement
const pricing = PricingEngine.calculateCredits(
  1920, 1080,  // Image dimensions
  'fermatresearch/magic-image-refiner',  // Model ID
  {}  // No special options
)

console.log(`Total: ${pricing.totalCredits} credits`)
console.log('Breakdown:', pricing.breakdown)
```

### Option-Based Pricing

```typescript
// Calculate with expensive options
const pricing = PricingEngine.calculateCredits(
  1920, 1080,
  'fermatresearch/magic-image-refiner',
  {
    creativity: 0.9,  // High creativity (expensive)
    hdr: 1.0,        // Enable HDR enhancement
    steps: 100       // High quality processing
  }
)

console.log(`With options: ${pricing.totalCredits} credits`)
pricing.optionModifiers.forEach(mod => {
  console.log(`- ${mod.name}: +${mod.credits} credits`)
})
```

### Model Comparison

```typescript
const models = [
  'fermatresearch/magic-image-refiner',
  'nightmareai/real-esrgan',
  'runninghub-flux-upscaling'
]

models.forEach(modelId => {
  const pricing = PricingEngine.calculateCredits(2160, 2160, modelId, {})
  console.log(`${modelId}: ${pricing.totalCredits} credits`)
})
```

## Configuration

### Resolution Tiers

Configure base costs for different image resolutions:

```typescript
const resolutionTiers = [
  {
    id: 'sd',
    name: 'Standard Definition',
    maxMegapixels: 1.0,
    baseCredits: 60,
    description: '≤ 1000×1000 pixels (≤ 1MP)'
  },
  {
    id: 'hd',
    name: 'High Definition',
    maxMegapixels: 2.25,
    baseCredits: 120,
    description: '≤ 1500×1500 pixels (≤ 2.25MP)'
  },
  // ... more tiers
]
```

### Model Configurations

Set model-specific pricing:

```typescript
const modelConfigs = [
  {
    modelId: 'fermatresearch/magic-image-refiner',
    name: 'Magic Image Refiner',
    creditMultiplier: 1.0,  // No multiplier
    flatFee: 0,             // No flat fee
    enabled: true
  },
  {
    modelId: 'runninghub-flux-upscaling',
    name: 'FLUX Advanced Upscaling',
    creditMultiplier: 1.4,  // 40% more expensive
    flatFee: 25,            // Plus 25 credits flat fee
    enabled: true
  }
]
```

### Option Modifiers

Configure how user options affect pricing:

```typescript
const options = [
  {
    optionKey: 'creativity',
    optionName: 'Creativity Level',
    modifierType: 'conditional',
    conditions: [
      { when: (val: number) => val > 0.5, modifier: 1.2 },  // 20% more
      { when: (val: number) => val > 0.8, modifier: 1.5 }   // 50% more
    ],
    description: 'Higher creativity increases cost'
  },
  {
    optionKey: 'face_enhance',
    optionName: 'Face Enhancement',
    modifierType: 'flat',
    value: 15,
    description: 'Face enhancement adds 15 credits'
  }
]
```

## Modifying Pricing

### Programmatic Updates

```typescript
// Update model pricing
PricingEngine.updateModelPricing('nightmareai/real-esrgan', {
  creditMultiplier: 1.2,  // Make 20% more expensive
  flatFee: 10             // Add 10 credit flat fee
})

// Update resolution tier
PricingEngine.updateResolutionTier('hd', {
  baseCredits: 150  // Increase HD base cost
})

// Add new option modifier
PricingEngine.addOptionModifier('fermatresearch/magic-image-refiner', {
  optionKey: 'quality_boost',
  optionName: 'Quality Boost',
  modifierType: 'flat',
  value: 50,
  description: 'Premium quality adds 50 credits'
})
```

### Admin Interface

Use the admin panel component:

```tsx
import { PricingConfigPanel } from '@/components/admin/PricingConfigPanel'

export function AdminPage() {
  return (
    <div className="p-6">
      <PricingConfigPanel />
    </div>
  )
}
```

## Integration Points

### Editor Integration

The editor automatically recalculates pricing when:
- User selects a different model
- User changes option values
- User uploads a different image
- User modifies enhancement settings

```tsx
const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null)

// Recalculate when settings change
useEffect(() => {
  if (selectedModel && imageDimensions) {
    const pricing = PricingEngine.calculateCredits(
      imageDimensions.width,
      imageDimensions.height,
      selectedModel.id,
      modelSettings
    )
    setPricingBreakdown(pricing)
  }
}, [selectedModel, imageDimensions, modelSettings])
```

### API Integration

The API uses the same pricing engine for credit validation:

```typescript
// Calculate credits before processing
const pricingBreakdown = PricingEngine.calculateCredits(
  settings.imageWidth,
  settings.imageHeight,
  modelId,
  settings
)
const requiredCredits = pricingBreakdown.totalCredits

// Check if user has enough credits
if (userCredits < requiredCredits) {
  return NextResponse.json({
    error: 'Insufficient credits',
    required: requiredCredits,
    breakdown: pricingBreakdown.breakdown
  })
}
```

## Option Modifier Types

### Conditional Modifiers

Apply pricing changes based on option values:

```typescript
{
  optionKey: 'steps',
  modifierType: 'conditional',
  conditions: [
    { when: (val: number) => val > 20, modifier: 1.1 },  // 10% more for >20 steps
    { when: (val: number) => val > 50, modifier: 1.3 },  // 30% more for >50 steps
    { when: (val: number) => val > 80, modifier: 1.5 }   // 50% more for >80 steps
  ]
}
```

### Flat Modifiers

Add fixed credit amounts:

```typescript
{
  optionKey: 'enable_myupscaler',
  modifierType: 'flat',
  value: 20,  // Always adds 20 credits when enabled
}
```

### Boolean Conditions

Handle on/off options:

```typescript
{
  optionKey: 'enable_upscale',
  conditions: [
    { when: (val: boolean) => val === true, modifier: 1.0 },
    { when: (val: boolean) => val === false, modifier: 0.7 }  // 30% discount when disabled
  ]
}
```

## Best Practices

### 1. Progressive Pricing
Structure options so basic usage is affordable, premium features cost more:

```typescript
// Good: Progressive scaling
{ when: (steps) => steps > 10, modifier: 1.0 },   // Base
{ when: (steps) => steps > 25, modifier: 1.2 },   // +20%
{ when: (steps) => steps > 50, modifier: 1.5 }    // +50%
```

### 2. Clear Naming
Use descriptive names for options and modifiers:

```typescript
{
  optionKey: 'creativity',
  optionName: 'Creativity Level',  // User-friendly name
  description: 'Higher creativity increases processing cost'
}
```

### 3. Testing
Always test pricing changes with various scenarios:

```typescript
const scenarios = PricingEngine.getPricingPreview('model-id', [
  { name: 'Basic', options: {} },
  { name: 'Advanced', options: { quality: 'high' } },
  { name: 'Premium', options: { quality: 'ultra', boost: true } }
])
```

### 4. Fallback Handling
Always provide fallbacks for pricing calculations:

```typescript
try {
  const pricing = PricingEngine.calculateCredits(width, height, modelId, options)
  return pricing.totalCredits
} catch (error) {
  console.warn('Pricing calculation failed:', error)
  return calculateCreditsConsumed(width, height) // Fallback to old method
}
```

## Troubleshooting

### Common Issues

1. **"Model not found" errors**: Ensure model ID matches exactly in configuration
2. **Unexpected pricing**: Check option modifiers and conditions
3. **Performance issues**: Avoid recalculating pricing on every render
4. **NaN results**: Validate all numeric inputs before calculation

### Debugging

Enable detailed logging:

```typescript
const pricing = PricingEngine.calculateCredits(width, height, modelId, options)
console.log('Pricing breakdown:', pricing.breakdown)
console.log('Option modifiers:', pricing.optionModifiers)
console.log('Resolution tier:', pricing.resolutionTier)
```

## Migration from Old System

The new system is backward compatible:

```typescript
// Old way (still works)
const credits = calculateCreditsConsumed(width, height)

// New way (with enhanced features)
const pricing = PricingEngine.calculateCredits(width, height, modelId, options)
const credits = pricing.totalCredits
```

Gradually migrate by:
1. Using new system in new components
2. Adding fallbacks in existing components
3. Eventually removing old calculations

## Future Enhancements

Planned features:
- Database-backed configuration
- A/B testing for pricing strategies
- User tier-based pricing (subscriptions)
- Bulk processing discounts
- Dynamic pricing based on demand
- Integration with payment systems