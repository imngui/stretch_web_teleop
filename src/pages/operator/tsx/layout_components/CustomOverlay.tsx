import React from "react";
import { className } from "shared/util";
import { CustomizableComponentProps } from "./CustomizableComponent";
import { CustomOverlayDefinition, CustomOverlayId } from "../utils/component_definitions";
import { FunctionProvider } from "../function_providers/FunctionProvider";
import "operator/css/CustomOverlay.css";

/**
 * Helper class to access robot control functions
 * Extends FunctionProvider to access protected remoteRobot
 */
class OverlayRobotController extends FunctionProvider {
    public static driveRobot(linVel: number, angVel: number) {
        if (!this.remoteRobot) {
            console.error('[OverlayRobotController] remoteRobot is undefined!');
            return;
        }
        this.remoteRobot.driveBase(linVel, angVel);
    }

    public static setRobotMode(mode: "position" | "navigation") {
        if (!this.remoteRobot) {
            console.error('[OverlayRobotController] remoteRobot is undefined!');
            return;
        }
        this.remoteRobot.setRobotMode(mode);
    }
}

/**
 * Custom overlay component router - selects and renders the appropriate overlay type.
 * This component acts as a factory that renders different overlay implementations
 * based on the overlay ID.
 *
 * @param props {@link CustomizableComponentProps}
 */
export const CustomOverlay = (props: CustomizableComponentProps) => {
    const definition = props.definition as CustomOverlayDefinition;
    const overlayId = definition.id || CustomOverlayId.RedLines;

    // Render the appropriate overlay based on the ID
    switch (overlayId) {
        case CustomOverlayId.RedLines:
            return <RedLinesOverlay {...props} />;
        case CustomOverlayId.BlueGrid:
            return <BlueGridOverlay {...props} />;
        case CustomOverlayId.Crosshair:
            return <CrosshairOverlay {...props} />;
        case CustomOverlayId.None:
            return null;
        default:
            console.warn(`Unknown overlay type: ${overlayId}`);
            return null;
    }
};

/**
 * Red Lines Overlay - displays 4 red lines at 1/5 and 4/5 positions
 * with hover-based robot movement control
 *
 * @param props {@link CustomizableComponentProps}
 */
const RedLinesOverlay = (props: CustomizableComponentProps) => {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const { customizing } = props.sharedState;
    const definition = props.definition as CustomOverlayDefinition;

    // Get line positions and thickness from definition, with defaults
    const horizontalLinePositions = definition.horizontalLinePositions || [20, 80];
    const verticalLinePositions = definition.verticalLinePositions || [20, 80];
    const lineThickness = definition.lineThickness || 0.5;

    // Example state for custom visuals - replace with your own data
    const [customVisuals, setCustomVisuals] = React.useState<CustomVisualData[]>([]);

    // State for tracking hover region and movement
    const [currentRegion, setCurrentRegion] = React.useState<HoverRegion>('center');
    const [isHovering, setIsHovering] = React.useState(false);
    const movementIntervalRef = React.useRef<number | null>(null);

    // Example: Update visuals from external data source
    React.useEffect(() => {
        // TODO: Subscribe to your data source here
        // Example: Listen to WebRTC messages, function provider updates, etc.

        // For demonstration, you can set initial visuals:
        // setCustomVisuals([
        //     { type: 'box', x: 100, y: 100, width: 50, height: 50, color: 'red' },
        //     { type: 'circle', x: 200, y: 200, radius: 25, color: 'blue' },
        // ]);
    }, []);

    // Canvas rendering function - call this to draw on canvas
    const drawOnCanvas = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // TODO: Add your custom canvas drawing logic here
        // Example:
        // ctx.strokeStyle = 'red';
        // ctx.lineWidth = 2;
        // ctx.strokeRect(100, 100, 200, 150);

        // Draw custom visuals
        customVisuals.forEach(visual => {
            if (visual.type === 'box') {
                ctx.strokeStyle = visual.color || 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(visual.x, visual.y, visual.width!, visual.height!);
            } else if (visual.type === 'circle') {
                ctx.strokeStyle = visual.color || 'blue';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(visual.x, visual.y, visual.radius!, 0, 2 * Math.PI);
                ctx.stroke();
            }
        });
    }, [customVisuals]);

    // Sync canvas size with container and redraw
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            canvas.width = width;
            canvas.height = height;
            drawOnCanvas();
        });

        resizeObserver.observe(canvas.parentElement!);
        return () => resizeObserver.disconnect();
    }, [drawOnCanvas]);

    // Redraw when visuals change
    React.useEffect(() => {
        drawOnCanvas();
    }, [customVisuals, drawOnCanvas]);

    // Handle mouse movement to detect region and control robot
    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const region = getHoverRegion(
            x, y, rect.width, rect.height,
            horizontalLinePositions,
            verticalLinePositions
        );
        setCurrentRegion(region);
        setIsHovering(true);
    }, [horizontalLinePositions, verticalLinePositions]);

    const handleMouseLeave = React.useCallback(() => {
        setIsHovering(false);
        setCurrentRegion('center');
    }, []);

    // Effect to send velocity commands based on hover region
    React.useEffect(() => {
        // Don't send commands while customizing
        if (customizing) {
            return;
        }

        // Clear any existing interval
        if (movementIntervalRef.current !== null) {
            window.clearInterval(movementIntervalRef.current);
            movementIntervalRef.current = null;
        }

        // If hovering and not in center, send velocity commands
        if (isHovering && currentRegion !== 'center') {
            // Switch to navigation mode to enable velocity control
            console.log(`[CustomOverlay] Hovering in region: ${currentRegion}, switching to navigation mode`);
            OverlayRobotController.setRobotMode("navigation");

            const [linVel, angVel] = getVelocityForRegion(currentRegion);
            console.log(`[CustomOverlay] Sending velocity command: linVel=${linVel}, angVel=${angVel}`);

            // Send initial command
            OverlayRobotController.driveRobot(linVel, angVel);

            // Set up interval to continuously send commands (heartbeat)
            movementIntervalRef.current = window.setInterval(() => {
                OverlayRobotController.driveRobot(linVel, angVel);
            }, 100); // Send every 100ms
        } else {
            // Stop the robot when in center or not hovering
            console.log('[CustomOverlay] Stopping robot (center or not hovering)');
            OverlayRobotController.driveRobot(0, 0);
            // Switch back to position mode
            OverlayRobotController.setRobotMode("position");
        }

        // Cleanup function
        return () => {
            if (movementIntervalRef.current !== null) {
                window.clearInterval(movementIntervalRef.current);
                movementIntervalRef.current = null;
            }
            // Stop robot and return to position mode when component unmounts or effect re-runs
            OverlayRobotController.driveRobot(0, 0);
            OverlayRobotController.setRobotMode("position");
        };
    }, [isHovering, currentRegion, customizing]);

    // If customizing, show a demo overlay
    const demoOverlay = customizing ? (
        <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="20"
        >
            Custom Overlay (Hover to Move)
        </text>
    ) : null;

    // Visual feedback for current hover region
    const regionHighlight = !customizing && isHovering && currentRegion !== 'center' ? (
        <text
            x="50%"
            y="10"
            textAnchor="middle"
            fill="rgba(255, 255, 0, 0.9)"
            fontSize="3"
            fontWeight="bold"
        >
            {currentRegion.toUpperCase()}
        </text>
    ) : null;

    return (
        <div
            className={className("custom-overlay-container", { customizing })}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* SVG Layer - for vector graphics */}
            <svg
                ref={svgRef}
                className="custom-overlay-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                {demoOverlay}
                {regionHighlight}

                {/* Red crosshair lines - customizable positions and thickness */}
                {/* Horizontal line at first position */}
                <line
                    x1="0"
                    y1={horizontalLinePositions[0]}
                    x2="100"
                    y2={horizontalLinePositions[0]}
                    stroke="red"
                    strokeWidth={lineThickness}
                    vectorEffect="non-scaling-stroke"
                />

                {/* Horizontal line at second position */}
                <line
                    x1="0"
                    y1={horizontalLinePositions[1]}
                    x2="100"
                    y2={horizontalLinePositions[1]}
                    stroke="red"
                    strokeWidth={lineThickness}
                    vectorEffect="non-scaling-stroke"
                />

                {/* Vertical line at first position */}
                <line
                    x1={verticalLinePositions[0]}
                    y1="0"
                    x2={verticalLinePositions[0]}
                    y2="100"
                    stroke="red"
                    strokeWidth={lineThickness}
                    vectorEffect="non-scaling-stroke"
                />

                {/* Vertical line at second position */}
                <line
                    x1={verticalLinePositions[1]}
                    y1="0"
                    x2={verticalLinePositions[1]}
                    y2="100"
                    stroke="red"
                    strokeWidth={lineThickness}
                    vectorEffect="non-scaling-stroke"
                />

                {/* Example SVG rendering of custom visuals */}
                {customVisuals.map((visual, idx) => {
                    if (visual.type === 'box') {
                        return (
                            <rect
                                key={idx}
                                x={visual.x}
                                y={visual.y}
                                width={visual.width}
                                height={visual.height}
                                fill="none"
                                stroke={visual.color || 'red'}
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                        );
                    } else if (visual.type === 'circle') {
                        return (
                            <circle
                                key={idx}
                                cx={visual.x}
                                cy={visual.y}
                                r={visual.radius}
                                fill="none"
                                stroke={visual.color || 'blue'}
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                        );
                    }
                    return null;
                })}
            </svg>

            {/* Canvas Layer - for raster graphics (optional, comment out if not needed) */}
            <canvas
                ref={canvasRef}
                className="custom-overlay-canvas"
                style={{ display: 'none' }} // Set to 'block' to use canvas instead of SVG
            />
        </div>
    );
};

/**
 * Blue Grid Overlay - displays a 3x3 blue grid
 *
 * @param props {@link CustomizableComponentProps}
 */
const BlueGridOverlay = (props: CustomizableComponentProps) => {
    const { customizing } = props.sharedState;
    const svgRef = React.useRef<SVGSVGElement>(null);

    const demoOverlay = customizing ? (
        <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="20"
        >
            Blue Grid
        </text>
    ) : null;

    return (
        <div className={className("custom-overlay-container", { customizing })}>
            <svg
                ref={svgRef}
                className="custom-overlay-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                {demoOverlay}

                {/* Blue grid lines - creating 3x3 grid */}
                {/* Vertical lines at 33.33% and 66.67% */}
                <line
                    x1="33.33"
                    y1="0"
                    x2="33.33"
                    y2="100"
                    stroke="blue"
                    strokeWidth="0.3"
                    vectorEffect="non-scaling-stroke"
                />
                <line
                    x1="66.67"
                    y1="0"
                    x2="66.67"
                    y2="100"
                    stroke="blue"
                    strokeWidth="0.3"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Horizontal lines at 33.33% and 66.67% */}
                <line
                    x1="0"
                    y1="33.33"
                    x2="100"
                    y2="33.33"
                    stroke="blue"
                    strokeWidth="0.3"
                    vectorEffect="non-scaling-stroke"
                />
                <line
                    x1="0"
                    y1="66.67"
                    x2="100"
                    y2="66.67"
                    stroke="blue"
                    strokeWidth="0.3"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
};

/**
 * Crosshair Overlay - displays center crosshair with circle
 *
 * @param props {@link CustomizableComponentProps}
 */
const CrosshairOverlay = (props: CustomizableComponentProps) => {
    const { customizing } = props.sharedState;
    const svgRef = React.useRef<SVGSVGElement>(null);

    const demoOverlay = customizing ? (
        <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="20"
        >
            Crosshair
        </text>
    ) : null;

    return (
        <div className={className("custom-overlay-container", { customizing })}>
            <svg
                ref={svgRef}
                className="custom-overlay-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                {demoOverlay}

                {/* Center crosshair */}
                {/* Horizontal center line */}
                <line
                    x1="0"
                    y1="50"
                    x2="100"
                    y2="50"
                    stroke="green"
                    strokeWidth="0.4"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Vertical center line */}
                <line
                    x1="50"
                    y1="0"
                    x2="50"
                    y2="100"
                    stroke="green"
                    strokeWidth="0.4"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Center circle */}
                <circle
                    cx="50"
                    cy="50"
                    r="10"
                    fill="none"
                    stroke="green"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Small center dot */}
                <circle
                    cx="50"
                    cy="50"
                    r="1"
                    fill="green"
                />
            </svg>
        </div>
    );
};

/**
 * Type definition for custom visual elements
 * Extend this interface to add your own visual types
 */
interface CustomVisualData {
    type: 'box' | 'circle' | 'line' | 'polygon';
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    color?: string;
    label?: string;
    // Add more properties as needed
}

/**
 * Hover regions for red lines overlay
 * Defines 9 zones created by the red lines at 20% and 80% positions
 */
type HoverRegion =
    | 'top-left' | 'top-center' | 'top-right'
    | 'center-left' | 'center' | 'center-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Determines which region the cursor is hovering over
 * Uses customizable line positions to create 9 zones
 */
function getHoverRegion(
    x: number,
    y: number,
    width: number,
    height: number,
    horizontalLinePositions: [number, number],
    verticalLinePositions: [number, number]
): HoverRegion {
    const xPercent = (x / width) * 100;
    const yPercent = (y / height) * 100;

    let horizontal: 'left' | 'center' | 'right';
    let vertical: 'top' | 'center' | 'bottom';

    // Determine horizontal region based on vertical line positions
    if (xPercent < verticalLinePositions[0]) {
        horizontal = 'left';
    } else if (xPercent > verticalLinePositions[1]) {
        horizontal = 'right';
    } else {
        horizontal = 'center';
    }

    // Determine vertical region based on horizontal line positions
    if (yPercent < horizontalLinePositions[0]) {
        vertical = 'top';
    } else if (yPercent > horizontalLinePositions[1]) {
        vertical = 'bottom';
    } else {
        vertical = 'center';
    }

    // Combine to create region name
    return `${vertical}-${horizontal}` as HoverRegion;
}

/**
 * Get robot velocity commands based on hover region
 * Returns [linearVelocity, angularVelocity]
 */
function getVelocityForRegion(region: HoverRegion): [number, number] {
    const linearSpeed = 0.1;  // m/s
    const angularSpeed = 0.3; // rad/s

    switch (region) {
        case 'top-left':
            return [linearSpeed, angularSpeed];       // Forward + Left
        case 'top-center':
            return [linearSpeed, 0];                   // Forward
        case 'top-right':
            return [linearSpeed, -angularSpeed];      // Forward + Right
        case 'center-left':
            return [0, angularSpeed];                  // Left
        case 'center':
            return [0, 0];                             // No movement
        case 'center-right':
            return [0, -angularSpeed];                 // Right
        case 'bottom-left':
            return [-linearSpeed, angularSpeed];      // Reverse + Left
        case 'bottom-center':
            return [-linearSpeed, 0];                  // Reverse
        case 'bottom-right':
            return [-linearSpeed, -angularSpeed];     // Reverse + Right
        default:
            return [0, 0];
    }
}

/**
 * Example function to update custom visuals from external data
 * Call this from a function provider or WebRTC message handler
 *
 * @param visuals Array of visual elements to display
 */
export function updateCustomOverlayVisuals(visuals: CustomVisualData[]) {
    // This is a placeholder - you'll need to implement proper state management
    // Options:
    // 1. Use a function provider to manage state
    // 2. Use React context
    // 3. Pass data through props from parent component
    console.log("Updating custom overlay visuals:", visuals);
}
