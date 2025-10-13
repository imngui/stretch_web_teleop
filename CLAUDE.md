# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a web-based teleoperation interface for Stretch robots (RE1, RE2, SE3) built on **ROS2 Humble**, **WebRTC**, **Nav2**, and **TypeScript/React**. The interface enables remote robot control through a web browser from anywhere in the world or locally on the same network.

The system has three main components:
1. **Operator browser** - Web UI running on the user's device
2. **Robot browser** - Hidden Playwright browser running on the robot
3. **Signaling server** - Node.js server managing WebRTC connections via Socket.io

## Build & Development Commands

### Initial Setup
```bash
# Install NPM dependencies
npm install --force

# Install pre-commit hooks (required for contributors)
python3 -m pip install pre-commit
pre-commit install
```

### Building
```bash
# Build for production (with Firebase storage)
npm run build

# Build for development (with Firebase storage)
npm run firebase

# Build for development (with local storage)
npm run localstorage
```

### Launching the Interface

**Production Launch (single command):**
```bash
./launch_interface.sh                                    # Basic launch
./launch_interface.sh -m maps/<map_name>.yaml           # With navigation map
./launch_interface.sh -t pyttsx3                        # With text-to-speech engine
./launch_interface.sh -f                                # With Firebase storage
```

**Development Launch (separate terminals for debugging):**
```bash
# Terminal 1: Launch ROS2 components
ros2 launch stretch_web_teleop web_interface.launch.py
# Optional args: map_yaml:=/path/to/map.yaml tts_engine:=pyttsx3

# Terminal 2: Build frontend (set certs first)
cd ~/ament_ws/src/stretch_web_teleop
export NODE_EXTRA_CA_CERTS="/home/hello-robot/ament_ws/src/stretch_web_teleop/certificates/rootCA.pem"
npm run localstorage  # or npm run firebase

# Terminal 3: Start signaling server
node server.js

# Terminal 4: Start robot browser
node start_robot_browser.js
```

**Stopping:**
```bash
./stop_interface.sh
```

### Testing & Linting
```bash
# Run ESLint
npx eslint src/

# Run pre-commit checks manually
pre-commit run --all-files

# Python formatting checks
black --check .
isort --profile black --check .
flake8 .
```

### Running Single Test
There are no automated unit tests in this codebase. Testing is done manually through the web interface.

## Architecture

### Communication Flow

```
Operator Browser <--WebRTC--> Signaling Server <--WebRTC--> Robot Browser <--WebSocket/ROSLib--> ROS2 Nodes
```

1. **Operator Browser** sends commands through WebRTC data channels
2. **Signaling Server** (server.js) establishes peer connections using Socket.io
3. **Robot Browser** (Playwright, headless) receives commands and communicates with ROS2
4. **ROSLib** provides WebSocket bridge to ROS2 via rosbridge_server
5. Video/audio streams flow through WebRTC media channels

### Directory Structure

**Frontend (src/):**
- `src/shared/` - Shared code between operator and robot
  - `commands.tsx` - Command definitions (the "protocol" between operator/robot)
  - `remoterobot.tsx` - API for operator to communicate with robot
  - `webrtcconnections.tsx` - WebRTC connection management
  - `util.tsx` - Shared types, enums, utilities
- `src/pages/operator/` - Operator browser UI
  - `tsx/index.tsx` - Entry point, creates RemoteRobot and WebRTCConnection
  - `tsx/Operator.tsx` - Main operator interface component
  - `tsx/function_providers/` - Business logic providers for UI components
  - `tsx/layout_components/` - Customizable UI components (can be added/removed)
  - `tsx/static_components/` - Fixed UI components (header, controls)
  - `tsx/basic_components/` - Reusable building blocks
- `src/pages/robot/` - Robot browser logic
  - `tsx/index.tsx` - Entry point, creates Robot and handles WebRTC messages
  - `tsx/robot.tsx` - Robot class wrapping ROSLib communication with ROS2
  - `tsx/videostreams.tsx` - Video stream management
  - `tsx/audiostreams.tsx` - Audio stream management
- `src/pages/home/` - Landing page

**Backend:**
- `server.js` - Express/Socket.io signaling server for WebRTC
- `start_robot_browser.js` - Launches Playwright browser on robot
- `nodes/` - ROS2 Python nodes
  - `move_to_pregrasp.py` - Click-to-pregrasp action server
  - `text_to_speech.py` - Text-to-speech node
  - `configure_video_streams.py` - Camera stream configuration
  - `navigation_camera.py`, `gripper_camera.py` - Camera nodes
- `launch/` - ROS2 launch files
  - `web_interface.launch.py` - Main launch file
  - `multi_camera.launch.py` - Camera configuration

**ROS2 Package Files:**
- `package.xml` - ROS2 package dependencies
- `CMakeLists.txt` - Build configuration
- `msg/TextToSpeech.msg` - Custom message
- `action/MoveToPregrasp.action` - Custom action

### Adding New Features: The Pattern

When adding a new capability (e.g., "home robot" button), follow this flow:

1. **Define command in `src/shared/commands.tsx`:**
   ```typescript
   export interface HomeTheRobotCommand {
       type: "homeTheRobot";
   }
   export type cmd = ... | HomeTheRobotCommand;
   ```

2. **Add method to `src/shared/remoterobot.tsx`:**
   ```typescript
   homeTheRobot() {
       let cmd: HomeTheRobotCommand = { type: "homeTheRobot" };
       this.robotChannel(cmd);
   }
   ```

3. **Handle command in robot browser (`src/pages/robot/tsx/index.tsx`):**
   ```typescript
   case "homeTheRobot":
       robot.homeTheRobot();
       break;
   ```

4. **Implement ROS2 communication in `src/pages/robot/tsx/robot.tsx`:**
   ```typescript
   createHomeTheRobotService() {
       this.homeTheRobotService = new ROSLIB.Service({
           ros: this.ros,
           name: "/home_the_robot",
           serviceType: "std_srvs/Trigger",
       });
   }
   ```

5. **Create function provider (`src/pages/operator/tsx/function_providers/`):**
   ```typescript
   export class HomeTheRobotFunctionProvider extends FunctionProvider {
       provideFunctions(fn: HomeTheRobotFunction) {
           case HomeTheRobotFunction.Home:
               return () => FunctionProvider.remoteRobot?.homeTheRobot();
       }
   }
   ```

6. **Create UI component (`src/pages/operator/tsx/layout_components/` or `static_components/`):**
   ```typescript
   export const HomeTheRobot = (props) => {
       let functions = {
           Home: homeTheRobotFunctionProvider.provideFunctions(HomeTheRobotFunction.Home)
       };
       return <button onClick={functions.Home}>Home Robot</button>;
   };
   ```

7. **Instantiate in `src/pages/operator/tsx/index.tsx`:**
   ```typescript
   export var homeTheRobotFunctionProvider = new HomeTheRobotFunctionProvider();
   ```

8. **Render in `src/pages/operator/tsx/Operator.tsx`:**
   ```typescript
   <HomeTheRobot hideLabels={!layout.current.displayLabels} />
   ```

See `documentation/development.md` for detailed walkthrough.

## Important Technical Details

### WebRTC Connection Management
- Only **one operator** can connect at a time
- Signaling server manages "rooms" via Socket.io
- Robot browser must join before operator can connect
- Connection states: "online" (robot ready), "occupied" (operator connected), "offline"

### ROSLib Communication
- Robot browser connects to rosbridge_server via WebSocket
- All ROS2 communication goes through rosbridge (topics, services, actions)
- Use `ROSLIB.Topic`, `ROSLIB.Service`, or `ROSLIB.ActionClient` classes
- Connect clients in `Robot.onConnect()` method

### Storage Handlers
- **localstorage** - Browser localStorage (development/local use)
- **firebase** - Firebase Firestore (production/remote use)
- Used for persisting UI layouts and preferences

### Video Streams
- Robot browser renders video to DOM (required hack for WebRTC transmission)
- Streams flow: ROS2 compressed images → Robot browser → WebRTC → Operator browser
- Camera types: head RealSense, navigation camera, gripper camera, wide-angle camera

### Audio Configuration
- Run `./configure_audio.sh` to set up audio devices
- May need reconfiguration after robot restart
- System defaults can change when (un)plugging devices

## ROS2 Integration

### Key Topics
- `/stretch/joint_states` - Robot joint positions
- `/battery` - Battery state
- `/compressed` image topics for camera streams
- `/amcl_pose` - Robot localization (with map)

### Key Services
- `/home_the_robot` - Homing sequence
- `/switch_to_position_mode`, `/switch_to_navigation_mode` - Control mode switching

### Key Actions
- `/navigate_to_pose` (nav2_msgs/action/NavigateToPose) - Navigation goals
- `/move_to_pregrasp` - Custom click-to-pregrasp action

### Launch Arguments
- `map_yaml` - Path to navigation map YAML
- `tts_engine` - Text-to-speech engine (e.g., pyttsx3)

## SSL Certificates

The interface requires HTTPS. Self-signed certificates are stored in `certificates/`. Set the environment variable before running webpack or Node.js:
```bash
export NODE_EXTRA_CA_CERTS="/home/hello-robot/ament_ws/src/stretch_web_teleop/certificates/rootCA.pem"
```

## Pre-commit Hooks

This repository enforces code quality via pre-commit hooks:
- **Python**: black, isort, flake8, mypy
- **JavaScript/TypeScript**: ESLint, Prettier
- **Shell scripts**: beautysh
- **Markdown**: mdformat
- **Other**: codespell, trailing whitespace, etc.

Run `pre-commit install` after cloning. Hooks run automatically before commits.

## Common Issues

**Build fails with module errors:** Run `npm install --force`

**Certificate errors:** Set `NODE_EXTRA_CA_CERTS` environment variable

**Audio not working:** Run `./configure_audio.sh` and check default devices with `pactl`

**Robot browser not connecting:** Check that rosbridge_server is running and accessible

**WebRTC connection fails:** Verify signaling server is running and accessible on port 443

## Useful References

- Full setup guide: README.md
- Development tutorial: documentation/development.md
- Usage guide: README.md "Usage Guide" section
- ROS2 packages: package.xml dependencies
