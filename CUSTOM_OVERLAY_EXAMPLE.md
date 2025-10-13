# Custom Overlay Example - Red Crosshair Lines

This document shows how to add the custom red crosshair overlay to your overhead camera view.

## What's Implemented

The `CustomOverlay` component now draws **4 red lines** (5px thick) across the camera view at:
- **Horizontal line** at 1/5 height (20% from top)
- **Horizontal line** at 4/5 height (80% from top)
- **Vertical line** at 1/5 width (20% from left)
- **Vertical line** at 4/5 width (80% from left)

These lines use `vectorEffect="non-scaling-stroke"` which ensures they remain 5px thick regardless of video resolution.

## How to Add to Your Layout

### Method 1: Add via Customization UI (When Running)

1. Launch the interface:
   ```bash
   ./launch_interface.sh
   ```

2. In the web interface, click the "Customize" button in the header

3. Click on the overhead camera view to select it

4. In the component menu, add a "Custom Overlay" child component

5. Click "Done" to save your layout

### Method 2: Add to Default Layout (Before Building)

Edit the layout definition file:

**File:** `src/pages/operator/tsx/default_layouts/SIMPLE_LAYOUT.tsx`

Find the overhead camera definition and add CustomOverlay as a child:

```typescript
import {
    ComponentType,
    CameraViewId,
    // ... other imports
} from "../utils/component_definitions";

// In the layout definition:
{
    type: ComponentType.CameraView,
    id: CameraViewId.overhead,
    displayButtons: true,
    children: [
        {
            type: ComponentType.CustomOverlay,
        }
    ],
} as CameraViewDefinition,
```

Then rebuild:
```bash
npm run localstorage
```

## How It Works

The component uses **SVG lines** with these properties:

```typescript
<line
    x1="0"      // Start at left edge
    y1="20"     // At 20% height (1/5)
    x2="100"    // End at right edge
    y2="20"     // At 20% height (1/5)
    stroke="red"
    strokeWidth="0.5"  // 5px visual thickness
    vectorEffect="non-scaling-stroke"  // Keeps line 5px regardless of scaling
/>
```

The `viewBox="0 0 100 100"` coordinate system is used:
- `x1="0"` to `x2="100"` = full width
- `y1="0"` to `y2="100"` = full height
- `x="20"` or `y="20"` = 1/5 position (20%)
- `x="80"` or `y="80"` = 4/5 position (80%)

## Customizing Further

To modify the lines, edit `src/pages/operator/tsx/layout_components/CustomOverlay.tsx`:

**Change line color:**
```typescript
stroke="red"  // Change to "blue", "green", "#FF00FF", etc.
```

**Change line thickness:**
```typescript
strokeWidth="0.5"  // Increase/decrease for thicker/thinner lines
```

**Change line positions:**
```typescript
y1="20"  // Change to "30" for 30% height, etc.
```

**Add more lines:**
```typescript
<line x1="0" y1="50" x2="100" y2="50" stroke="red" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
// This adds a horizontal line at 50% (center)
```

**Make lines dashed:**
```typescript
strokeDasharray="5,5"  // Creates dashed pattern
```

## Files Modified

1. **CustomOverlay.tsx** - Component with red crosshair lines
2. **component_definitions.tsx** - Registered CustomOverlay type
3. **CameraView.tsx** - Added support for CustomOverlay
4. **CustomOverlay.css** - Styling for overlay positioning

## Preview

When enabled, you'll see:
```
┌─────────────────────────────┐
│         |         |         │  ← Top (empty space)
├─────────┼─────────┼─────────┤  ← Red line at 1/5 height
│         |         |         │
│         |         |         │
│─────────┼─────────┼─────────│  ← Vertical lines at 1/5 and 4/5 width
│         |         |         │
│         |         |         │
├─────────┼─────────┼─────────┤  ← Red line at 4/5 height
│         |         |         │  ← Bottom (empty space)
└─────────────────────────────┘
```

This creates a grid that divides the camera view into sections, useful for:
- Alignment and positioning
- Visual reference points
- Navigation assistance
- Object placement guidance
