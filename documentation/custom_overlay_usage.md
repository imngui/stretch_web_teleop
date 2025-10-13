# Custom Camera Overlay Usage Guide

This guide explains how to use the CustomOverlay component to add visual elements on top of camera views in the Stretch Web Teleop interface.

## Overview

The `CustomOverlay` component allows you to display custom graphics (SVG or Canvas-based) overlaid on any camera view, particularly useful for:
- Bounding boxes for object detection
- Navigation paths or trajectories
- AR markers and annotations
- Sensor data visualizations
- Click-to-grasp indicators
- Any custom visual feedback

## Quick Start

### 1. Adding CustomOverlay to a Camera View

To add a custom overlay to a camera view, modify your layout definition:

```typescript
// In your layout definition (e.g., SIMPLE_LAYOUT.tsx)
{
    type: ComponentType.CameraView,
    id: CameraViewId.overhead,
    displayButtons: true,
    children: [
        {
            type: ComponentType.CustomOverlay,
        }
    ],
} as CameraViewDefinition
```

### 2. Customizing the Overlay Visuals

The `CustomOverlay` component supports both SVG and Canvas rendering:

#### Option A: SVG-based Graphics (Recommended for simple shapes)

Edit `src/pages/operator/tsx/layout_components/CustomOverlay.tsx`:

```typescript
// In the CustomOverlay component's render method
<svg
    ref={svgRef}
    className="custom-overlay-svg"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
>
    {/* Add your SVG elements here */}
    <rect x="25" y="25" width="50" height="50"
          fill="none" stroke="red" strokeWidth="2" />
    <circle cx="50" cy="50" r="10" fill="blue" opacity="0.5" />
    <text x="50" y="95" textAnchor="middle" fill="white">
        Object Detected
    </text>
</svg>
```

#### Option B: Canvas-based Graphics (Better for complex/dynamic visuals)

```typescript
// In CustomOverlay.tsx, update the drawOnCanvas function
const drawOnCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding box
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.strokeRect(100, 100, 200, 150);

    // Draw label
    ctx.fillStyle = 'red';
    ctx.font = '16px Arial';
    ctx.fillText('Cup', 105, 95);
}, []);
```

To use Canvas instead of SVG, in `CustomOverlay.tsx` change:
```typescript
<canvas
    ref={canvasRef}
    className="custom-overlay-canvas"
    style={{ display: 'block' }} // Change from 'none' to 'block'
/>
```

## Advanced Usage

### Receiving Data from Robot

To display data from the robot (e.g., object detection results), you'll need to:

1. **Send data from robot browser** (`src/pages/robot/tsx/robot.tsx`):
```typescript
// Subscribe to ROS topic with detection data
this.detectionSubscriber = new ROSLIB.Topic({
    ros: this.ros,
    name: '/object_detections',
    messageType: 'vision_msgs/Detection2DArray'
});

this.detectionSubscriber.subscribe((message) => {
    // Forward to operator via WebRTC
    this.sendDetections(message);
});
```

2. **Define command** in `src/shared/commands.tsx`:
```typescript
export interface ObjectDetectionCommand {
    type: "objectDetections";
    detections: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        label: string;
        confidence: number;
    }>;
}

export type cmd = ... | ObjectDetectionCommand;
```

3. **Handle in operator** (`src/pages/operator/tsx/index.tsx`):
```typescript
function handleWebRTCMessage(message: WebRTCMessage | WebRTCMessage[]) {
    switch (message.type) {
        case "objectDetections":
            // Update overlay visuals
            customOverlayFunctionProvider.updateDetections(message.detections);
            break;
        // ... other cases
    }
}
```

4. **Create function provider** (`src/pages/operator/tsx/function_providers/CustomOverlayFunctionProvider.tsx`):
```typescript
import { FunctionProvider } from "./FunctionProvider";

export class CustomOverlayFunctionProvider extends FunctionProvider {
    private detections: any[] = [];
    private updateCallback?: (detections: any[]) => void;

    setUpdateCallback(callback: (detections: any[]) => void) {
        this.updateCallback = callback;
    }

    updateDetections(detections: any[]) {
        this.detections = detections;
        if (this.updateCallback) {
            this.updateCallback(detections);
        }
    }

    getDetections() {
        return this.detections;
    }
}
```

5. **Use in CustomOverlay component**:
```typescript
// In CustomOverlay.tsx
import { customOverlayFunctionProvider } from "../index";

export const CustomOverlay = (props: CustomizableComponentProps) => {
    const [detections, setDetections] = React.useState<any[]>([]);

    React.useEffect(() => {
        customOverlayFunctionProvider.setUpdateCallback(setDetections);
    }, []);

    return (
        <svg ...>
            {detections.map((det, idx) => (
                <rect
                    key={idx}
                    x={det.x}
                    y={det.y}
                    width={det.width}
                    height={det.height}
                    fill="none"
                    stroke="red"
                    strokeWidth="2"
                />
            ))}
        </svg>
    );
};
```

### Coordinate Systems

**Important:** Camera views use different coordinate systems:

- **SVG coordinates**: Use `viewBox` to match camera resolution
  - Overhead camera: 1280x720 (use `viewBox="0 0 1280 720"`)
  - Realsense camera: 640x480 (use `viewBox="0 0 640 480"`)
  - Gripper camera: 640x480 (use `viewBox="0 0 640 480"`)

- **Canvas coordinates**: Match canvas element size in pixels
  - Sync with video: `canvas.width = video.videoWidth`

- **Normalized coordinates** (0.0 to 1.0):
  - Convert to pixels: `x_pixels = x_normalized * width`
  - Useful for robot data that's resolution-independent

### Interactive Overlays

To make your overlay interactive (e.g., click to select):

```typescript
// In CustomOverlay.tsx
const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (customizing) return; // Ignore during customization

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    console.log("Clicked at", x, y);
    // Send command to robot or update state
};

return (
    <svg onClick={handleClick} style={{ pointerEvents: 'auto' }}>
        {/* Your visuals */}
    </svg>
);
```

## Examples

### Example 1: Simple Bounding Box

```typescript
<svg viewBox="0 0 1280 720" preserveAspectRatio="none">
    <rect x="400" y="300" width="200" height="150"
          fill="none" stroke="red" strokeWidth="3" />
    <text x="405" y="295" fill="red" fontSize="20">Cup</text>
</svg>
```

### Example 2: Animated Crosshair

```typescript
const [rotation, setRotation] = React.useState(0);

React.useEffect(() => {
    const interval = setInterval(() => {
        setRotation(r => (r + 1) % 360);
    }, 16);
    return () => clearInterval(interval);
}, []);

return (
    <svg viewBox="0 0 100 100">
        <g transform={`rotate(${rotation} 50 50)`}>
            <line x1="50" y1="0" x2="50" y2="100"
                  stroke="cyan" strokeWidth="2" />
            <line x1="0" y1="50" x2="100" y2="50"
                  stroke="cyan" strokeWidth="2" />
        </g>
    </svg>
);
```

### Example 3: Depth Visualization

```typescript
const drawDepthOverlay = (ctx: CanvasRenderingContext2D, depthData: number[][]) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const depth = depthData[y]?.[x] || 0;
            const color = depth < 1.0 ? `rgba(255, 0, 0, ${1 - depth})` : 'transparent';
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        }
    }
};
```

## Troubleshooting

### Overlay not showing up
- Check that CustomOverlay is in the camera view's `children` array
- Verify z-index in CSS (should be above video)
- Check browser console for errors

### Coordinates are wrong
- Verify viewBox matches camera resolution
- Use `preserveAspectRatio="none"` to stretch overlay to fit
- Check if you're using normalized vs pixel coordinates

### Performance issues
- Use Canvas for many dynamic elements (>100)
- Use SVG for few static/simple shapes
- Throttle updates (max 30fps)

### Overlay blocked by other elements
- Check z-index values in CSS
- Verify pointer-events setting
- Check if ButtonPad overlay conflicts

## Additional Resources

- See `PredictiveDisplay.tsx` for example of complex SVG overlay
- See `CameraView.tsx` for how overlays are integrated
- ROS visualization_msgs for standard message types
- HTML Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- SVG Reference: https://developer.mozilla.org/en-US/docs/Web/SVG
