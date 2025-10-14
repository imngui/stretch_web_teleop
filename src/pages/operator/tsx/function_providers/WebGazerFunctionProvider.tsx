import { FunctionProvider } from "./FunctionProvider";
import { WebGazerFunction } from "../layout_components/WebGazerControl";

export interface GazeData {
    x: number;
    y: number;
}

export enum WebGazerMode {
    Off = "Off",
    Calibration = "Calibration",
    GazeTracking = "Gaze Tracking",
    GazeClick = "Gaze Click",
}

/**
 * Function provider for WebGazer eye-tracking functionality.
 * Manages WebGazer initialization, calibration, and gaze prediction.
 */
export class WebGazerFunctionProvider extends FunctionProvider {
    private isInitialized: boolean = false;
    private currentMode: WebGazerMode = WebGazerMode.Off;
    private gazeCallback?: (data: GazeData) => void;
    private modeCallback?: (mode: WebGazerMode) => void;
    private webgazer: any = null;

    constructor() {
        super();
        this.provideFunctions = this.provideFunctions.bind(this);
        this.initializeWebGazer = this.initializeWebGazer.bind(this);
        this.startTracking = this.startTracking.bind(this);
        this.stopTracking = this.stopTracking.bind(this);
        this.setMode = this.setMode.bind(this);
    }

    /**
     * Dynamically imports and initializes WebGazer
     */
    private async initializeWebGazer() {
        if (this.isInitialized) return;

        try {
            // Dynamically import webgazer
            const webgazerModule = await import("webgazer");
            this.webgazer = webgazerModule.default;

            // Configure WebGazer
            this.webgazer
                .setGazeListener((data: any) => {
                    if (data && this.gazeCallback) {
                        this.gazeCallback({ x: data.x, y: data.y });
                    }
                })
                .showVideoPreview(true)
                .showPredictionPoints(true)
                .applyKalmanFilter(true)
                .saveDataAcrossSessions(true);

            this.isInitialized = true;
            console.log("WebGazer initialized successfully");
        } catch (error) {
            console.error("Failed to initialize WebGazer:", error);
            throw error;
        }
    }

    /**
     * Starts WebGazer tracking
     */
    public async startTracking() {
        if (!this.isInitialized) {
            await this.initializeWebGazer();
        }

        if (this.webgazer) {
            try {
                await this.webgazer.begin();
                console.log("WebGazer tracking started");
                this.setMode(WebGazerMode.Calibration);
            } catch (error) {
                console.error("Failed to start WebGazer:", error);
            }
        }
    }

    /**
     * Stops WebGazer tracking
     */
    public stopTracking() {
        if (this.webgazer && this.isInitialized) {
            this.webgazer.end();
            console.log("WebGazer tracking stopped");
            this.setMode(WebGazerMode.Off);
        }
    }

    /**
     * Pauses WebGazer tracking
     */
    public pauseTracking() {
        if (this.webgazer && this.isInitialized) {
            this.webgazer.pause();
            console.log("WebGazer tracking paused");
        }
    }

    /**
     * Resumes WebGazer tracking
     */
    public resumeTracking() {
        if (this.webgazer && this.isInitialized) {
            this.webgazer.resume();
            console.log("WebGazer tracking resumed");
        }
    }

    /**
     * Sets the current WebGazer mode
     */
    private setMode(mode: WebGazerMode) {
        this.currentMode = mode;
        if (this.modeCallback) {
            this.modeCallback(mode);
        }
    }

    /**
     * Gets the current mode
     */
    public getMode(): WebGazerMode {
        return this.currentMode;
    }

    /**
     * Changes to calibration mode
     */
    public enterCalibrationMode() {
        this.setMode(WebGazerMode.Calibration);
    }

    /**
     * Changes to gaze tracking mode
     */
    public enterGazeTrackingMode() {
        this.setMode(WebGazerMode.GazeTracking);
    }

    /**
     * Changes to gaze click mode
     */
    public enterGazeClickMode() {
        this.setMode(WebGazerMode.GazeClick);
    }

    /**
     * Registers a callback to receive gaze data
     */
    public setGazeCallback(callback: (data: GazeData) => void) {
        this.gazeCallback = callback;
    }

    /**
     * Registers a callback to receive mode changes
     */
    public setModeCallback(callback: (mode: WebGazerMode) => void) {
        this.modeCallback = callback;
    }

    /**
     * Shows or hides the video preview
     */
    public setShowVideoPreview(show: boolean) {
        if (this.webgazer) {
            if (show) {
                this.webgazer.showVideoPreview(true);
            } else {
                this.webgazer.showVideoPreview(false);
            }
        }
    }

    /**
     * Shows or hides prediction points
     */
    public setShowPredictionPoints(show: boolean) {
        if (this.webgazer) {
            if (show) {
                this.webgazer.showPredictionPoints(true);
            } else {
                this.webgazer.showPredictionPoints(false);
            }
        }
    }

    /**
     * Provides functions for the WebGazer component
     */
    public provideFunctions(webGazerFunction: WebGazerFunction) {
        switch (webGazerFunction) {
            case WebGazerFunction.Start:
                return () => this.startTracking();
            case WebGazerFunction.Stop:
                return () => this.stopTracking();
            case WebGazerFunction.Pause:
                return () => this.pauseTracking();
            case WebGazerFunction.Resume:
                return () => this.resumeTracking();
            case WebGazerFunction.EnterCalibration:
                return () => this.enterCalibrationMode();
            case WebGazerFunction.EnterGazeTracking:
                return () => this.enterGazeTrackingMode();
            case WebGazerFunction.EnterGazeClick:
                return () => this.enterGazeClickMode();
            case WebGazerFunction.ToggleVideoPreview:
                return (show: boolean) => this.setShowVideoPreview(show);
            case WebGazerFunction.TogglePredictionPoints:
                return (show: boolean) => this.setShowPredictionPoints(show);
        }
    }
}
