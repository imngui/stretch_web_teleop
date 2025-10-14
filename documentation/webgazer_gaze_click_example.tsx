/**
 * Example: Implementing Gaze-Click Functionality
 *
 * This file demonstrates how to extend the WebGazer integration to support
 * gaze-based clicking (dwell time clicking). This is an example implementation
 * that can be adapted and integrated into the actual codebase.
 *
 * @file webgazer_gaze_click_example.tsx
 */

import React, { useEffect, useState, useRef } from "react";
import { webGazerFunctionProvider } from "../src/pages/operator/tsx/index";
import { GazeData } from "../src/pages/operator/tsx/function_providers/WebGazerFunctionProvider";

/**
 * Configuration for gaze-click behavior
 */
interface GazeClickConfig {
    /** Time in milliseconds user must look at target before click triggers */
    dwellTime: number;
    /** Radius in pixels within which gaze must stay to count as dwelling */
    dwellRadius: number;
    /** Whether to show visual feedback during dwell */
    showFeedback: boolean;
}

const DEFAULT_CONFIG: GazeClickConfig = {
    dwellTime: 1000, // 1 second
    dwellRadius: 50, // 50 pixels
    showFeedback: true,
};

/**
 * Hook for gaze-click functionality
 *
 * Tracks gaze position and triggers clicks when user dwells on a clickable element.
 *
 * @example
 * ```tsx
 * const GazeClickButton = () => {
 *     const { registerClickable } = useGazeClick();
 *     const buttonRef = useRef<HTMLButtonElement>(null);
 *
 *     useEffect(() => {
 *         if (buttonRef.current) {
 *             registerClickable(buttonRef.current, () => {
 *                 console.log("Gaze clicked!");
 *             });
 *         }
 *     }, []);
 *
 *     return <button ref={buttonRef}>Look at me to click</button>;
 * };
 * ```
 */
export function useGazeClick(config: GazeClickConfig = DEFAULT_CONFIG) {
    const [currentGaze, setCurrentGaze] = useState<GazeData | null>(null);
    const [dwellingOn, setDwellingOn] = useState<HTMLElement | null>(null);
    const [dwellProgress, setDwellProgress] = useState<number>(0);

    const dwellStartTime = useRef<number | null>(null);
    const dwellPosition = useRef<{ x: number; y: number } | null>(null);
    const clickables = useRef<Map<HTMLElement, () => void>>(new Map());

    // Subscribe to gaze data
    useEffect(() => {
        webGazerFunctionProvider.setGazeCallback((data: GazeData) => {
            setCurrentGaze(data);
        });
    }, []);

    // Check for dwell and trigger clicks
    useEffect(() => {
        if (!currentGaze) return;

        const { x, y } = currentGaze;
        const hoveredElement = findHoveredClickable(x, y);

        if (hoveredElement) {
            // Check if we're still dwelling on the same element
            if (dwellingOn === hoveredElement && dwellPosition.current) {
                const distance = Math.hypot(
                    x - dwellPosition.current.x,
                    y - dwellPosition.current.y
                );

                if (distance <= config.dwellRadius) {
                    // Still within dwell radius, update progress
                    const elapsed = Date.now() - dwellStartTime.current!;
                    const progress = Math.min(elapsed / config.dwellTime, 1);
                    setDwellProgress(progress);

                    if (progress >= 1) {
                        // Dwell time reached, trigger click!
                        const callback = clickables.current.get(hoveredElement);
                        if (callback) {
                            callback();
                        }
                        // Reset dwell
                        resetDwell();
                    }
                } else {
                    // Moved outside dwell radius, restart
                    startDwell(hoveredElement, x, y);
                }
            } else {
                // New element or first time, start dwelling
                startDwell(hoveredElement, x, y);
            }
        } else {
            // No longer hovering over clickable, reset
            resetDwell();
        }
    }, [currentGaze, dwellingOn, config]);

    /**
     * Start dwelling on an element
     */
    function startDwell(element: HTMLElement, x: number, y: number) {
        setDwellingOn(element);
        dwellStartTime.current = Date.now();
        dwellPosition.current = { x, y };
        setDwellProgress(0);
    }

    /**
     * Reset dwell state
     */
    function resetDwell() {
        setDwellingOn(null);
        dwellStartTime.current = null;
        dwellPosition.current = null;
        setDwellProgress(0);
    }

    /**
     * Find which clickable element is under the gaze position
     */
    function findHoveredClickable(x: number, y: number): HTMLElement | null {
        for (const element of clickables.current.keys()) {
            const rect = element.getBoundingClientRect();
            if (
                x >= rect.left &&
                x <= rect.right &&
                y >= rect.top &&
                y <= rect.bottom
            ) {
                return element;
            }
        }
        return null;
    }

    /**
     * Register an element as clickable via gaze
     * @param element The DOM element to make clickable
     * @param callback Function to call when gaze-clicked
     * @returns Cleanup function to unregister the element
     */
    function registerClickable(
        element: HTMLElement,
        callback: () => void
    ): () => void {
        clickables.current.set(element, callback);

        // Add visual indicator that element is gaze-clickable
        element.classList.add("gaze-clickable");

        // Cleanup function
        return () => {
            clickables.current.delete(element);
            element.classList.remove("gaze-clickable");
        };
    }

    return {
        registerClickable,
        dwellingOn,
        dwellProgress,
        currentGaze,
    };
}

/**
 * Visual feedback component showing dwell progress
 *
 * Renders a circular progress indicator at the gaze position when dwelling on
 * a clickable element.
 */
export const GazeDwellFeedback: React.FC<{
    dwellingOn: HTMLElement | null;
    dwellProgress: number;
    currentGaze: GazeData | null;
}> = ({ dwellingOn, dwellProgress, currentGaze }) => {
    if (!dwellingOn || !currentGaze) return null;

    const size = 60;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - dwellProgress * circumference;

    return (
        <div
            style={{
                position: "fixed",
                left: currentGaze.x - size / 2,
                top: currentGaze.y - size / 2,
                width: size,
                height: size,
                pointerEvents: "none",
                zIndex: 10000,
            }}
        >
            <svg width={size} height={size}>
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#4CAF50"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{
                        transition: "stroke-dashoffset 0.1s linear",
                    }}
                />
            </svg>
        </div>
    );
};

/**
 * Example: Button component that can be clicked via gaze
 */
export const GazeClickableButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
}> = ({ onClick, children, className }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { registerClickable } = useGazeClick();

    useEffect(() => {
        if (buttonRef.current) {
            const cleanup = registerClickable(buttonRef.current, onClick);
            return cleanup;
        }
    }, [onClick]);

    return (
        <button
            ref={buttonRef}
            className={className}
            onClick={onClick} // Still support mouse clicks
        >
            {children}
        </button>
    );
};

/**
 * Example: Complete gaze-click enabled interface
 *
 * Shows how to integrate gaze-click into a robot control interface
 */
export const GazeClickInterface: React.FC = () => {
    const { dwellingOn, dwellProgress, currentGaze } = useGazeClick({
        dwellTime: 1500, // 1.5 seconds for robot controls
        dwellRadius: 60,
        showFeedback: true,
    });

    const handleMoveForward = () => {
        console.log("Moving robot forward via gaze click!");
        // FunctionProvider.remoteRobot?.moveBase(0.1, 0, 0);
    };

    const handleMoveBackward = () => {
        console.log("Moving robot backward via gaze click!");
        // FunctionProvider.remoteRobot?.moveBase(-0.1, 0, 0);
    };

    const handleStop = () => {
        console.log("Stopping robot via gaze click!");
        // FunctionProvider.remoteRobot?.stopExecution();
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Gaze-Click Robot Control</h2>
            <p>Look at a button for 1.5 seconds to activate it</p>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginTop: "20px",
                }}
            >
                <GazeClickableButton
                    onClick={handleMoveForward}
                    className="gaze-btn"
                >
                    Move Forward
                </GazeClickableButton>

                <GazeClickableButton
                    onClick={handleMoveBackward}
                    className="gaze-btn"
                >
                    Move Backward
                </GazeClickableButton>

                <GazeClickableButton onClick={handleStop} className="gaze-btn">
                    Stop
                </GazeClickableButton>
            </div>

            {/* Visual feedback */}
            <GazeDwellFeedback
                dwellingOn={dwellingOn}
                dwellProgress={dwellProgress}
                currentGaze={currentGaze}
            />

            {/* CSS for gaze-clickable elements */}
            <style>{`
                .gaze-btn {
                    padding: 20px 40px;
                    font-size: 18px;
                    border: 2px solid #ccc;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .gaze-btn:hover,
                .gaze-btn.gaze-clickable:hover {
                    background-color: #f0f0f0;
                    border-color: #999;
                }

                .gaze-clickable {
                    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
                }
            `}</style>
        </div>
    );
};

/**
 * Integration Steps:
 *
 * 1. Import this module in your component:
 *    ```typescript
 *    import { useGazeClick, GazeDwellFeedback } from './webgazer_gaze_click_example';
 *    ```
 *
 * 2. Use the hook in your component:
 *    ```typescript
 *    const { registerClickable, dwellingOn, dwellProgress, currentGaze } = useGazeClick();
 *    ```
 *
 * 3. Register clickable elements:
 *    ```typescript
 *    useEffect(() => {
 *        if (buttonRef.current) {
 *            return registerClickable(buttonRef.current, handleClick);
 *        }
 *    }, []);
 *    ```
 *
 * 4. Add visual feedback:
 *    ```tsx
 *    <GazeDwellFeedback
 *        dwellingOn={dwellingOn}
 *        dwellProgress={dwellProgress}
 *        currentGaze={currentGaze}
 *    />
 *    ```
 *
 * 5. Style gaze-clickable elements with CSS:
 *    ```css
 *    .gaze-clickable {
 *        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3);
 *    }
 *    ```
 */
