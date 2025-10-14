# WebGazer Eye-Tracking Integration Guide

This document explains how to use the WebGazer eye-tracking library with the Stretch Web Teleop interface.

## Overview

WebGazer.js is integrated into the operator interface to enable webcam-based eye tracking. This allows operators to interact with the robot using gaze-based controls, which can be especially useful for accessibility or hands-free operation.

## Features

- **Real-time eye tracking** using the operator's webcam
- **Self-calibration** through user interactions
- **Multiple interaction modes**:
  - Calibration mode for training the eye tracker
  - Gaze tracking mode for passive gaze monitoring
  - Gaze click mode for gaze-based clicking (to be implemented)
- **Visual feedback** with prediction points and video preview
- **Persistent calibration** across sessions (saved in browser)

## Setup

### 1. Add WebGazer Control to Your Layout

WebGazer is now available as a customizable component in the operator interface:

1. Click the **Customize** button in the operator header
2. In the sidebar, select **"WebGazer Control"** from the component list
3. Drag it to a drop zone in your layout (typically in a side panel)
4. Click **Customize** again to exit customization mode

### 2. Grant Camera Permissions

When you start WebGazer for the first time, your browser will request permission to access your webcam. You must grant this permission for eye tracking to work.

## Usage

### Starting Eye Tracking

1. Click the **"Start Tracking"** button in the WebGazer control panel
2. Wait for your webcam to initialize
3. The interface will automatically enter **Calibration** mode

### Calibration Mode

Calibration trains WebGazer to accurately predict where you're looking on the screen:

1. **Look at different areas** of the screen
2. **Click** on various points while looking directly at them
3. The more clicks you provide (aim for 20+ points), the better the accuracy
4. Try to cover all areas of the screen, especially where robot controls are located
5. WebGazer will show prediction points indicating where it thinks you're looking

**Tips for better calibration:**
- Click in areas where you'll frequently look during robot operation
- Recalibrate if you move your head position significantly
- Ensure good lighting and position your face clearly in the webcam view

### Interaction Modes

Once calibrated, you can switch between different modes:

#### Gaze Tracking Mode
- Monitors your gaze position in real-time
- Displays current gaze coordinates (X, Y pixels)
- Useful for testing calibration accuracy
- Does not trigger any robot actions

#### Gaze Click Mode (To Be Implemented)
- Allows clicking on interface elements by dwelling your gaze
- Configurable dwell time before click is triggered
- Visual feedback showing dwell progress
- Can be used to control robot without mouse/touch input

### Display Options

You can toggle visual elements:

- **Video Preview**: Shows/hides the webcam feed with face tracking overlay
- **Prediction Points**: Shows/hides the red dots indicating predicted gaze location

### Controls

- **Stop**: Completely stops eye tracking and releases the webcam
- **Pause**: Temporarily pauses tracking (useful when looking away from screen)

## Architecture

### Components Created

1. **WebGazerFunctionProvider** (`src/pages/operator/tsx/function_providers/WebGazerFunctionProvider.tsx`)
   - Manages WebGazer initialization and lifecycle
   - Handles gaze data callbacks
   - Provides functions for mode switching

2. **WebGazerControl** (`src/pages/operator/tsx/layout_components/WebGazerControl.tsx`)
   - UI component for controlling eye tracking
   - Displays current mode and gaze position
   - Provides buttons for all eye tracking functions

3. **CSS Styling** (`src/pages/operator/css/WebGazerControl.css`)
   - Styles for the control panel
   - Responsive design for different screen sizes

### Integration Points

- Added to `ComponentType` enum in `component_definitions.tsx`
- Registered in `CustomizableComponent.tsx` render switch
- Added to sidebar component list in `Sidebar.tsx`
- Function provider instantiated in `index.tsx`

## Example Use Cases

### 1. Accessibility - Hands-Free Operation

For operators with limited hand mobility:

1. Use gaze tracking to monitor attention areas
2. Implement gaze-click mode to select controls
3. Combine with voice commands for multimodal interaction

### 2. Attention Monitoring

Monitor where operators are looking during teleoperation:

1. Track gaze patterns during different tasks
2. Identify which camera views are used most
3. Optimize UI layout based on attention data

### 3. Predictive Assistance

Use gaze data to predict operator intent:

1. Pre-load camera views based on gaze direction
2. Highlight controls that operator is looking at
3. Provide context-sensitive help based on attention

## Extending WebGazer Functionality

### Adding Gaze-Based Robot Control

To implement gaze-based clicking or other gaze-triggered actions:

1. **Monitor gaze data** in the function provider:
   ```typescript
   webGazerFunctionProvider.setGazeCallback((data) => {
       // Implement dwell time logic
       // Check if gaze is over a clickable element
       // Trigger action after dwell threshold
   });
   ```

2. **Add dwell time tracking**:
   - Track how long gaze remains in a region
   - Provide visual feedback (shrinking circle, progress bar)
   - Trigger click event when threshold is reached

3. **Implement gaze-based navigation**:
   - Map gaze position to robot camera control
   - Move robot head/camera to follow operator's gaze
   - Adjust sensitivity and dead zones

### Integrating with ROS2

To send gaze data to the robot:

1. **Define new commands** in `src/shared/commands.tsx`:
   ```typescript
   export interface GazeDataCommand {
       type: "gazeData";
       x: number;
       y: number;
       timestamp: number;
   }
   ```

2. **Add to RemoteRobot** in `src/shared/remoterobot.tsx`:
   ```typescript
   sendGazeData(x: number, y: number) {
       let cmd: GazeDataCommand = {
           type: "gazeData",
           x: x,
           y: y,
           timestamp: Date.now()
       };
       this.robotChannel(cmd);
   }
   ```

3. **Handle in robot browser** (`src/pages/robot/tsx/index.tsx`):
   ```typescript
   case "gazeData":
       robot.handleGazeData(cmd.x, cmd.y, cmd.timestamp);
       break;
   ```

4. **Publish to ROS2** in `src/pages/robot/tsx/robot.tsx`:
   ```typescript
   handleGazeData(x: number, y: number, timestamp: number) {
       const msg = new ROSLIB.Message({
           x: x,
           y: y,
           timestamp: timestamp
       });
       this.gazeDataTopic.publish(msg);
   }
   ```

### Custom Calibration Patterns

To implement structured calibration (e.g., 9-point grid):

1. **Create calibration overlay** component
2. **Display calibration points** in fixed positions
3. **Guide user** through clicking each point in sequence
4. **Validate accuracy** after calibration
5. **Allow recalibration** of specific points

## Troubleshooting

### Eye Tracking Not Working

- **Check camera permissions**: Ensure browser has webcam access
- **Check lighting**: Poor lighting affects face detection
- **Check browser compatibility**: WebGazer works best in Chrome/Edge
- **Clear browser data**: Reset saved calibration if behavior is erratic

### Poor Tracking Accuracy

- **Recalibrate**: Click "Enter Calibration" and add more calibration points
- **Adjust position**: Keep your face in the same position after calibration
- **Check webcam quality**: Higher resolution cameras provide better accuracy
- **Minimize head movement**: Stay relatively still during operation

### Performance Issues

- **Disable video preview**: Hide the webcam feed if not needed
- **Disable prediction points**: Turn off visual feedback for better performance
- **Close other applications**: WebGazer is computationally intensive

## Browser Compatibility

WebGazer works on most modern browsers:

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Edge 79+
- ⚠️ Safari (limited support)
- ❌ IE (not supported)

## Privacy and Data

- **All processing is local**: Eye tracking runs entirely in your browser
- **No data is sent to servers**: Calibration data stays on your device
- **Optional persistence**: Calibration saved in browser localStorage
- **Clear data**: Stop tracking and clear browser data to reset

## Future Enhancements

Planned improvements to the WebGazer integration:

1. **Gaze-click implementation**: Dwell-time based clicking
2. **Gaze-based navigation**: Control robot camera with gaze
3. **Multi-target selection**: Select multiple objects by looking at them
4. **Attention heatmaps**: Visualize where operators look most
5. **Calibration quality metrics**: Show calibration accuracy scores
6. **Adaptive sensitivity**: Auto-adjust based on user performance
7. **Head gesture recognition**: Detect head nods/shakes for commands

## References

- [WebGazer.js GitHub](https://github.com/brownhci/WebGazer)
- [WebGazer.js Official Site](https://webgazer.cs.brown.edu/)
- [WebGazer API Documentation](https://github.com/brownhci/WebGazer/wiki/Top-Level-API)
- [Research Paper](https://doi.org/10.24963/ijcai.2018/177)

## Support

For issues or questions about the WebGazer integration:

1. Check this documentation
2. Review the [WebGazer GitHub issues](https://github.com/brownhci/WebGazer/issues)
3. Open an issue in the stretch_web_teleop repository
