# Custom Overlay - Toggle-Based Implementation

## Overview

The **Custom Overlay** feature displays red crosshair lines on camera views. It's integrated as a **toggle option** in the camera view settings (similar to "Display Buttons"), making it easy to enable/disable without dragging components.

## Features

### Visual Display
- **4 red crosshair lines** at:
  - Horizontal: 1/5 height (20%) and 4/5 height (80%)
  - Vertical: 1/5 width (20%) and 4/5 width (80%)
- **5px thickness** maintained across all resolutions
- Works on **all camera views**: Overhead, Realsense, and Gripper

### Integration Method
- ✅ **Toggle button** in camera settings (not a separate draggable component)
- ✅ Appears when camera view is selected in Customize mode
- ✅ Simple on/off control alongside other camera options

## How to Use

### Step-by-Step Instructions

1. **Build the project:**
   ```bash
   npm run localstorage
   ```

2. **Launch the interface:**
   ```bash
   ./launch_interface.sh
   ```

3. **Enable Custom Overlay:**
   - Click the **"Customize"** button in the top-right corner
   - **Click on any camera view** (overhead, realsense, or gripper)
   - In the **right sidebar**, you'll see camera settings including:
     - ☑️ **Custom Overlay** ← Click here to toggle on/off
     - ☑️ Display Buttons
   - Toggle **"Custom Overlay"** to **ON** (button turns turquoise)
   - Click **"Done"** to exit customize mode
   - The red crosshair lines will now be visible! 🎯

4. **Disable Custom Overlay:**
   - Re-enter Customize mode
   - Select the camera view
   - Toggle **"Custom Overlay"** to **OFF** (button turns red)
   - Done!

### Visual Guide
```
┌─────────────────────────────────┐
│   CUSTOMIZE MODE - SIDEBAR      │
├─────────────────────────────────┤
│ Selected: Overhead Camera View  │
├─────────────────────────────────┤
│                                 │
│  [ON] Custom Overlay  ← Toggle! │
│  [ON] Display Buttons           │
│                                 │
└─────────────────────────────────┘
```

## Crosshair Display

When enabled, you'll see:
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

## Customization

### Change Line Color
Edit **`src/pages/operator/tsx/layout_components/CustomOverlay.tsx`** (lines 118-159):

```typescript
stroke="red"  // Change to: "blue", "green", "#00FF00", etc.
```

### Change Line Thickness
```typescript
strokeWidth="0.5"  // Increase for thicker lines (e.g., "1.0")
```

### Change Line Positions
```typescript
y1="20"  // For 1/5 = 20%
y1="30"  // For 3/10 = 30%
y1="25"  // For 1/4 = 25%
```

### Add Center Crosshairs
Add these lines in the same file:
```typescript
{/* Center horizontal line */}
<line x1="0" y1="50" x2="100" y2="50"
      stroke="red" strokeWidth="0.5"
      vectorEffect="non-scaling-stroke" />

{/* Center vertical line */}
<line x1="50" y1="0" x2="50" y2="100"
      stroke="red" strokeWidth="0.5"
      vectorEffect="non-scaling-stroke" />
```

### Make Lines Dashed
```typescript
stroke="red"
strokeWidth="0.5"
strokeDasharray="10,5"  ← Add this for dashed pattern
vectorEffect="non-scaling-stroke"
```

## Files Modified

### Core Implementation:
1. **`CustomOverlay.tsx`** - Component with crosshair lines
2. **`CameraView.tsx`** - Renders overlay when enabled
3. **`component_definitions.tsx`** - Type definition

### Toggle Integration:
4. **`Sidebar.tsx`** - Added toggle buttons to camera settings
   - `OverheadVideoStreamOptions` - Overhead camera
   - `VideoStreamOptions` - Realsense and Gripper cameras

### Cleanup:
5. **`DropZone.tsx`** - Removed from droppable components

## Technical Details

### Toggle Behavior
- **Mutually exclusive** with Predictive Display on overhead camera
- **Independent** on Realsense and Gripper cameras
- State persists when saving/loading layouts
- Automatically adds/removes from camera view's children array

### Component Hierarchy
```
CameraView
  ├── children: []  (when overlay OFF)
  └── children: [{ type: ComponentType.CustomOverlay }]  (when overlay ON)
```

### State Management
The toggle state is managed by checking:
```typescript
const co = definition.children.length > 0 &&
           definition.children[0].type == ComponentType.CustomOverlay;
```

## Advantages of Toggle Approach

✅ **Simpler UX** - No dragging required, just click a toggle
✅ **Less clutter** - Not in the component provider sidebar
✅ **Intuitive** - Settings are where users expect them
✅ **Consistent** - Follows same pattern as "Display Buttons"
✅ **Quick** - Faster to enable/disable than drag-and-drop

## Comparison: Old vs New

### ❌ Old Approach (Draggable Component)
1. Click Customize
2. Scroll to find "Custom Overlay" in sidebar
3. Click to select it
4. Click camera view
5. Click pin icon to drop
6. Click Done

### ✅ New Approach (Toggle)
1. Click Customize
2. Click camera view
3. Toggle "Custom Overlay" ON
4. Click Done

**Result:** 4 steps instead of 6! 🚀

## Troubleshooting

**"Toggle not showing"**
- Make sure you selected a camera view, not another component
- Check that you're in Customize mode

**"Lines not appearing"**
- Toggle should show as turquoise/ON
- Try clicking Done and re-entering Customize to verify state
- Check browser console for errors

**"Toggle resets when I reload"**
- Make sure to save your layout (in Customize sidebar)
- Check that layout is loading correctly

## Future Enhancements

The CustomOverlay component is ready for dynamic data:

- Add object detection bounding boxes
- Show navigation waypoints
- Display AR markers
- Overlay depth information
- Show gripper alignment guides

See `documentation/custom_overlay_usage.md` for advanced integration patterns.

## Summary

The Custom Overlay is now a **first-class camera setting**, accessible via a simple toggle button. This makes it much easier to enable/disable crosshair lines without dealing with drag-and-drop mechanics.

**Quick Start:** Customize → Select Camera → Toggle "Custom Overlay" ON → Done! ✨
