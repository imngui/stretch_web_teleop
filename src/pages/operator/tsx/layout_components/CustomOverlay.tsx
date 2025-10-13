import React from "react";
import { className } from "shared/util";
import { CustomizableComponentProps } from "./CustomizableComponent";
import { CustomOverlayDefinition, CustomOverlayId } from "../utils/component_definitions";
import "operator/css/CustomOverlay.css";

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
 *
 * @param props {@link CustomizableComponentProps}
 */
const RedLinesOverlay = (props: CustomizableComponentProps) => {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const { customizing } = props.sharedState;

    // Example state for custom visuals - replace with your own data
    const [customVisuals, setCustomVisuals] = React.useState<CustomVisualData[]>([]);

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

    // If customizing, show a demo overlay
    const demoOverlay = customizing ? (
        <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.7)"
            fontSize="20"
        >
            Custom Overlay
        </text>
    ) : null;

    return (
        <div className={className("custom-overlay-container", { customizing })}>
            {/* SVG Layer - for vector graphics */}
            <svg
                ref={svgRef}
                className="custom-overlay-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                {demoOverlay}

                {/* Red crosshair lines - 5px thick */}
                {/* Horizontal line at 1/5 height (20%) */}
                <line
                    x1="0"
                    y1="20"
                    x2="100"
                    y2="20"
                    stroke="red"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Horizontal line at 4/5 height (80%) */}
                <line
                    x1="0"
                    y1="80"
                    x2="100"
                    y2="80"
                    stroke="red"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Vertical line at 1/5 width (20%) */}
                <line
                    x1="20"
                    y1="0"
                    x2="20"
                    y2="100"
                    stroke="red"
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Vertical line at 4/5 width (80%) */}
                <line
                    x1="80"
                    y1="0"
                    x2="80"
                    y2="100"
                    stroke="red"
                    strokeWidth="0.5"
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
