# Custom Overlay with Multiple Types - Implementation Guide

## Overview

The Custom Overlay feature now supports **multiple overlay types** that users can select from a dropdown menu! Instead of a single red line overlay, you can choose from:

- **Red Lines** - 4 red lines at 1/5 and 4/5 positions (original)
- **Blue Grid** - 3x3 blue grid pattern
- **Crosshair** - Center crosshair with circle (green)

## 🎯 How It Works

The CustomOverlay component now acts as a **factory/router** that renders different overlay implementations based on the selected type ID. This makes it easy to add new overlay types in the future!

### Architecture

```typescript
CustomOverlay (router)
  ├── RedLinesOverlay (4 red lines at 1/5, 4/5)
  ├── BlueGridOverlay (3x3 grid)
  └── CrosshairOverlay (center crosshair + circle)
```

## 🚀 How to Use

### Step 1: Enable Custom Overlay

1. **Build:** `npm run localstorage`
2. **Launch:** `./launch_interface.sh`
3. **Enter Customize Mode:** Click "Customize" button
4. **Select Camera:** Click any camera view (overhead, realsense, or gripper)
5. **Toggle ON:** In sidebar, toggle "Custom Overlay" to ON

### Step 2: Select Overlay Type

Once Custom Overlay is enabled, a **dropdown menu** appears:

```
┌─────────────────────────────────┐
│   CAMERA VIEW SETTINGS          │
├─────────────────────────────────┤
│  [ON] Custom Overlay            │
│                                 │
│  Overlay Type: [Red Lines ▼]   │ ← Select here!
│    Options:                     │
│    • Red Lines                  │
│    • Blue Grid                  │
│    • Crosshair                  │
│                                 │
│  [ON] Display Buttons           │
└─────────────────────────────────┘
```

### Step 3: Switch Overlay Types

- Click the dropdown to see all available overlay types
- Select any type to immediately switch to it
- The overlay updates in real-time!

## 📐 Overlay Type Details

### Red Lines
```
┌──────────────────────────────┐
│          |        |          │
├──────────┼────────┼──────────┤  ← 1/5 height
│          |        |          │
│          |        |          │
│──────────┼────────┼──────────│  ← Vertical lines
│          |        |          │
│          |        |          │
├──────────┼────────┼──────────┤  ← 4/5 height
│          |        |          │
└──────────────────────────────┘
       ↑              ↑
    1/5 width     4/5 width
```
- **Color:** Red
- **Lines:** 4 total (2 horizontal, 2 vertical)
- **Positions:** 20% and 80% (1/5 and 4/5)
- **Use Case:** Alignment guides, object positioning

### Blue Grid
```
┌───────┬───────┬───────┐
│       │       │       │
│       │       │       │
├───────┼───────┼───────┤
│       │       │       │
│       │       │       │
├───────┼───────┼───────┤
│       │       │       │
│       │       │       │
└───────┴───────┴───────┘
```
- **Color:** Blue
- **Pattern:** 3x3 grid
- **Positions:** Lines at 33.33% and 66.67%
- **Use Case:** Rule of thirds composition, spatial reference

### Crosshair
```
┌──────────────────────────────┐
│            |                 │
│            |                 │
│            |                 │
│────────────●─────────────────│ ← Center
│            |                 │
│            |                 │
│            |                 │
└──────────────────────────────┘
```
- **Color:** Green
- **Pattern:** Center cross with circle
- **Circle Radius:** 10% of view
- **Use Case:** Precise centering, targeting, alignment

## 🎨 Adding New Overlay Types

Want to add your own overlay? Follow these steps:

### 1. Add Overlay ID to Enum

Edit `src/pages/operator/tsx/utils/component_definitions.tsx`:

```typescript
export enum CustomOverlayId {
    RedLines = "Red Lines",
    BlueGrid = "Blue Grid",
    Crosshair = "Crosshair",
    YourNewOverlay = "Your New Overlay",  // ← Add here
    None = "None",
}
```

### 2. Create Overlay Component

Add to `src/pages/operator/tsx/layout_components/CustomOverlay.tsx`:

```typescript
/**
 * Your New Overlay - description here
 */
const YourNewOverlay = (props: CustomizableComponentProps) => {
    const { customizing } = props.sharedState;
    const svgRef = React.useRef<SVGSVGElement>(null);

    return (
        <div className={className("custom-overlay-container", { customizing })}>
            <svg
                ref={svgRef}
                className="custom-overlay-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                {/* Your SVG elements here */}
                <circle cx="50" cy="50" r="20" stroke="purple" fill="none" />
            </svg>
        </div>
    );
};
```

### 3. Register in Router

Update the switch statement in `CustomOverlay`:

```typescript
export const CustomOverlay = (props: CustomizableComponentProps) => {
    const definition = props.definition as CustomOverlayDefinition;
    const overlayId = definition.id || CustomOverlayId.RedLines;

    switch (overlayId) {
        case CustomOverlayId.RedLines:
            return <RedLinesOverlay {...props} />;
        case CustomOverlayId.BlueGrid:
            return <BlueGridOverlay {...props} />;
        case CustomOverlayId.Crosshair:
            return <CrosshairOverlay {...props} />;
        case CustomOverlayId.YourNewOverlay:  // ← Add case
            return <YourNewOverlay {...props} />;
        case CustomOverlayId.None:
            return null;
        default:
            console.warn(`Unknown overlay type: ${overlayId}`);
            return null;
    }
};
```

### 4. Done!

Rebuild and your new overlay will appear in the dropdown! 🎉

## 💡 Overlay Ideas to Implement

Here are some ideas for additional overlay types you could add:

- **Corner Markers** - Small markers in each corner
- **Horizon Line** - Horizontal line at 50%
- **Diagonal Cross** - X pattern from corners
- **Fibonacci Spiral** - Golden ratio guide
- **Safe Zones** - Shaded areas showing safe/dangerous zones
- **Distance Rings** - Concentric circles for depth perception
- **Angle Indicators** - Protractor-style angle guides
- **Custom Grid (5x5, 7x7)** - Different grid sizes
- **Target Reticle** - Sniper-style targeting overlay
- **Dynamic Markers** - Show robot state/status

## 🔧 Technical Details

### Files Modified

1. **`component_definitions.tsx`**
   - Added `CustomOverlayId` enum
   - Added `CustomOverlayDefinition` type
   - Updated `ComponentId` union type

2. **`CustomOverlay.tsx`**
   - Refactored to router pattern
   - Implemented 3 overlay types (RedLines, BlueGrid, Crosshair)
   - Each overlay is self-contained component

3. **`Sidebar.tsx`**
   - Added imports for `CustomOverlayId` and `CustomOverlayDefinition`
   - Added dropdown for overlay type selection
   - Updated toggle functions to include overlay ID
   - Dropdown appears when overlay is enabled

### Data Flow

```
User selects dropdown
  ↓
setOverlayType() called
  ↓
Updates definition.children[0].id
  ↓
props.updateLayout() called
  ↓
CustomOverlay re-renders
  ↓
Switch statement routes to correct overlay component
  ↓
Overlay renders with SVG
```

### State Management

The overlay type is stored in the layout definition:

```typescript
definition.children = [{
    type: ComponentType.CustomOverlay,
    id: CustomOverlayId.BlueGrid  // ← Stored here
}]
```

This means:
- ✅ State persists across page reloads
- ✅ Saved with layout when user saves custom layout
- ✅ Loaded correctly when layout is restored

## 🎬 Demo Workflow

1. Click "Customize"
2. Click overhead camera
3. Toggle "Custom Overlay" → ON
4. Dropdown appears showing "Red Lines"
5. Click dropdown → Select "Blue Grid"
6. Camera now shows 3x3 blue grid!
7. Change to "Crosshair" → Green crosshair appears
8. Click "Done" to exit customize mode
9. Overlay persists and is saved!

## 📚 Additional Resources

- **Base Implementation:** See `CUSTOM_OVERLAY_TOGGLE.md`
- **Advanced Usage:** See `documentation/custom_overlay_usage.md`
- **Original Spec:** See `CUSTOM_OVERLAY_COMPLETE.md`

## 🎉 Summary

The Custom Overlay feature now provides:

✅ **Multiple overlay types** (Red Lines, Blue Grid, Crosshair)
✅ **Easy switching** via dropdown menu
✅ **Extensible architecture** - easy to add new types
✅ **Clean UI** - dropdown only shows when overlay is enabled
✅ **Persistent state** - selection saved with layout
✅ **Works on all cameras** - overhead, realsense, gripper

This makes the overlay system much more flexible and powerful! 🚀
