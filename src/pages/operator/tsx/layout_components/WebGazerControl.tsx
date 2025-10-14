import React, { useEffect, useState } from "react";
import { webGazerFunctionProvider } from "../index";
import { WebGazerMode } from "../function_providers/WebGazerFunctionProvider";
import { CustomizableComponentProps } from "./CustomizableComponent";
import { ComponentType } from "../utils/component_definitions";
import "operator/css/WebGazerControl.css";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import PauseIcon from "@mui/icons-material/Pause";
import TuneIcon from "@mui/icons-material/Tune";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";

/** All the possible WebGazer functions */
export enum WebGazerFunction {
    Start,
    Stop,
    Pause,
    Resume,
    EnterCalibration,
    EnterGazeTracking,
    EnterGazeClick,
    ToggleVideoPreview,
    TogglePredictionPoints,
}

export interface WebGazerFunctions {
    Start: () => void;
    Stop: () => void;
    Pause: () => void;
    Resume: () => void;
    EnterCalibration: () => void;
    EnterGazeTracking: () => void;
    EnterGazeClick: () => void;
    ToggleVideoPreview: (show: boolean) => void;
    TogglePredictionPoints: (show: boolean) => void;
}

/**
 * WebGazer control panel component for eye-tracking functionality.
 * Allows users to start/stop tracking, calibrate, and switch between modes.
 */
export const WebGazerControl = (props: CustomizableComponentProps) => {
    const [currentMode, setCurrentMode] = useState<WebGazerMode>(
        WebGazerMode.Off,
    );
    const [showVideoPreview, setShowVideoPreview] = useState<boolean>(true);
    const [showPredictionPoints, setShowPredictionPoints] =
        useState<boolean>(true);
    const [gazePosition, setGazePosition] = useState<{
        x: number;
        y: number;
    } | null>(null);

    useEffect(() => {
        // Register callbacks with the function provider
        webGazerFunctionProvider.setModeCallback(setCurrentMode);
        webGazerFunctionProvider.setGazeCallback(setGazePosition);
    }, []);

    const functions: WebGazerFunctions = {
        Start: webGazerFunctionProvider.provideFunctions(
            WebGazerFunction.Start,
        ) as () => void,
        Stop: webGazerFunctionProvider.provideFunctions(
            WebGazerFunction.Stop,
        ) as () => void,
        Pause: webGazerFunctionProvider.provideFunctions(
            WebGazerFunction.Pause,
        ) as () => void,
        Resume: webGazerFunctionProvider.provideFunctions(
            WebGazerFunction.Resume,
        ) as () => void,
        EnterCalibration: webGazerFunctionProvider.provideFunctions(
            WebGazerFunction.EnterCalibration,
        ) as () => void,
        EnterGazeTracking: webGazerFunctionProvider.provideFunctions(
            WebGazerFunction.EnterGazeTracking,
        ) as () => void,
        EnterGazeClick: webGazerFunctionProvider.provideFunctions(
            WebGazerFunction.EnterGazeClick,
        ) as () => void,
        ToggleVideoPreview: webGazerFunctionProvider.provideFunctions(
            WebGazerFunction.ToggleVideoPreview,
        ) as (show: boolean) => void,
        TogglePredictionPoints: webGazerFunctionProvider.provideFunctions(
            WebGazerFunction.TogglePredictionPoints,
        ) as (show: boolean) => void,
    };

    const handleToggleVideoPreview = () => {
        const newState = !showVideoPreview;
        setShowVideoPreview(newState);
        functions.ToggleVideoPreview(newState);
    };

    const handleTogglePredictionPoints = () => {
        const newState = !showPredictionPoints;
        setShowPredictionPoints(newState);
        functions.TogglePredictionPoints(newState);
    };

    return (
        <div className="webgazer-control-container">
            <div className="webgazer-header">
                <h3>Eye Tracking Control</h3>
                <span className="webgazer-mode-indicator">
                    Mode: {currentMode}
                </span>
            </div>

            {/* Main control buttons */}
            <div className="webgazer-main-controls">
                {currentMode === WebGazerMode.Off ? (
                    <button
                        onClick={functions.Start}
                        className="webgazer-btn webgazer-btn-primary"
                        title="Start eye tracking"
                    >
                        <PlayArrowIcon />
                        <span hidden={props.hideLabels}>Start Tracking</span>
                    </button>
                ) : (
                    <>
                        <button
                            onClick={functions.Stop}
                            className="webgazer-btn webgazer-btn-danger"
                            title="Stop eye tracking"
                        >
                            <StopIcon />
                            <span hidden={props.hideLabels}>Stop</span>
                        </button>
                        <button
                            onClick={functions.Pause}
                            className="webgazer-btn"
                            title="Pause eye tracking"
                        >
                            <PauseIcon />
                            <span hidden={props.hideLabels}>Pause</span>
                        </button>
                    </>
                )}
            </div>

            {/* Mode selection */}
            {currentMode !== WebGazerMode.Off && (
                <div className="webgazer-mode-controls">
                    <h4 hidden={props.hideLabels}>Interaction Modes</h4>
                    <div className="webgazer-mode-buttons">
                        <button
                            onClick={functions.EnterCalibration}
                            className={`webgazer-btn ${currentMode === WebGazerMode.Calibration ? "webgazer-btn-active" : ""}`}
                            title="Enter calibration mode"
                        >
                            <TuneIcon />
                            <span hidden={props.hideLabels}>Calibration</span>
                        </button>
                        <button
                            onClick={functions.EnterGazeTracking}
                            className={`webgazer-btn ${currentMode === WebGazerMode.GazeTracking ? "webgazer-btn-active" : ""}`}
                            title="Enter gaze tracking mode"
                        >
                            <RemoveRedEyeIcon />
                            <span hidden={props.hideLabels}>
                                Gaze Tracking
                            </span>
                        </button>
                        <button
                            onClick={functions.EnterGazeClick}
                            className={`webgazer-btn ${currentMode === WebGazerMode.GazeClick ? "webgazer-btn-active" : ""}`}
                            title="Enter gaze click mode"
                        >
                            <TouchAppIcon />
                            <span hidden={props.hideLabels}>Gaze Click</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Display options */}
            {currentMode !== WebGazerMode.Off && (
                <div className="webgazer-display-options">
                    <h4 hidden={props.hideLabels}>Display Options</h4>
                    <div className="webgazer-toggle-row">
                        <button
                            onClick={handleToggleVideoPreview}
                            className={`webgazer-btn webgazer-toggle-btn ${showVideoPreview ? "webgazer-btn-active" : ""}`}
                            title="Toggle video preview"
                        >
                            {showVideoPreview ? (
                                <VisibilityIcon />
                            ) : (
                                <VisibilityOffIcon />
                            )}
                            <span hidden={props.hideLabels}>
                                Video Preview
                            </span>
                        </button>
                        <button
                            onClick={handleTogglePredictionPoints}
                            className={`webgazer-btn webgazer-toggle-btn ${showPredictionPoints ? "webgazer-btn-active" : ""}`}
                            title="Toggle prediction points"
                        >
                            {showPredictionPoints ? (
                                <VisibilityIcon />
                            ) : (
                                <VisibilityOffIcon />
                            )}
                            <span hidden={props.hideLabels}>
                                Prediction Points
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Gaze position display */}
            {currentMode !== WebGazerMode.Off && gazePosition && (
                <div
                    className="webgazer-gaze-info"
                    hidden={props.hideLabels}
                >
                    <h4>Current Gaze Position</h4>
                    <div className="webgazer-gaze-coords">
                        <span>X: {Math.round(gazePosition.x)}px</span>
                        <span>Y: {Math.round(gazePosition.y)}px</span>
                    </div>
                </div>
            )}

            {/* Instructions */}
            {currentMode === WebGazerMode.Calibration && (
                <div
                    className="webgazer-instructions"
                    hidden={props.hideLabels}
                >
                    <p>
                        <strong>Calibration Instructions:</strong>
                    </p>
                    <ul>
                        <li>Look at different areas of the screen</li>
                        <li>Click on various points while looking at them</li>
                        <li>
                            More clicks = better accuracy (aim for 20+ points)
                        </li>
                        <li>
                            Switch to "Gaze Tracking" mode when calibration is
                            complete
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
};

// Define the component type for the customization system
export const webGazerComponentType = ComponentType.WebGazerControl;
