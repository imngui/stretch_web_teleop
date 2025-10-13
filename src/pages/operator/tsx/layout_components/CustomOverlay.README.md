# CustomOverlay Component

A flexible overlay component for displaying custom graphics on top of camera views in the Stretch Web Teleop interface.

## Quick Start

### 1. Add to Layout

Add CustomOverlay to any camera view in your layout definition:

```typescript
{
    type: ComponentType.CameraView,
    id: CameraViewId.overhead,
    displayButtons: true,
    children: [
        {
            type: ComponentType.CustomOverlay,
        }
    ],
}
```

### 2. Customize Visuals

Edit `CustomOverlay.tsx` to add your custom graphics:

**For SVG (simple shapes, text, lines):**
```typescript
<svg viewBox="0 0 1280 720" preserveAspectRatio="none">
    <rect x="100" y="100" width="200" height="150"
          fill="none" stroke="red" strokeWidth="2" />
    <text x="105" y="95" fill="red">Object</text>
</svg>
```

**For Canvas (complex/dynamic graphics):**
```typescript
const ctx = canvasRef.current?.getContext('2d');
ctx.strokeStyle = 'red';
ctx.strokeRect(100, 100, 200, 150);
```

## Key Features

- ✅ **Dual rendering modes**: SVG for vector graphics, Canvas for raster graphics
- ✅ **Automatic sizing**: Overlay scales with video stream
- ✅ **Customization support**: Shows demo overlay in customize mode
- ✅ **Performance optimized**: ResizeObserver for efficient updates
- ✅ **Integration ready**: Designed to receive data from function providers

## Camera Resolutions

Use appropriate viewBox for your camera:
- Overhead: `viewBox="0 0 1280 720"`
- Realsense: `viewBox="0 0 640 480"`
- Gripper: `viewBox="0 0 640 480"`

## Complete Documentation

See [documentation/custom_overlay_usage.md](../../../../documentation/custom_overlay_usage.md) for:
- Advanced usage examples
- Receiving data from robot
- Interactive overlays
- Function provider integration
- Troubleshooting guide

## Architecture

```
CameraView (parent)
  └── video element (camera stream)
  └── CustomOverlay (child overlay)
      ├── SVG layer (vector graphics)
      └── Canvas layer (raster graphics)
```

## Files Modified

This feature was implemented in:
- `CustomOverlay.tsx` - Main component (this folder)
- `CustomOverlay.css` - Styling (css folder)
- `component_definitions.tsx` - Type registration
- `CameraView.tsx` - Integration with camera view

## Examples

See the component file for example visual data structures and rendering patterns.
