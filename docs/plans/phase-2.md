# Phase 2 Implementation Plan - Sandquake

## Overview
Phase 2 will transform Sandquake into a Progressive Web App (PWA) with enhanced interaction capabilities, including mouse/touch controls, advanced simulation features with randomness, and real-time audio-visual analytics with seismograph and spectrum displays.

## Requirements Analysis

### System Requirements
- Convert to PWA with offline capabilities
- Add service worker and web app manifest

### New UI Features
- Mouse control with 'e' key toggle for camera pan/tilt/zoom
- Touch gestures for mobile devices
- Randomness slider control
- Seismograph window (bottom-left)
- Spectrum analyzer window (bottom-right)

### Enhanced Simulation Features
- Randomness factor for avalanche jitter
- Real-time seismograph data generation
- FFT spectrum analysis of seismograph signal

## Project Structure Extensions

```
src/
├── core/
│   ├── SandPile.js           # [MODIFIED] Add randomness to avalanche
│   ├── Simulation.js         # [MODIFIED] Add seismograph data tracking
│   ├── SandSource.js         # [EXISTING]
│   └── SeismographData.js    # [NEW] Seismograph signal processing
├── graphics/
│   ├── Scene.js              # [EXISTING]
│   ├── Camera.js             # [EXISTING]
│   ├── SandRenderer.js       # [EXISTING]
│   ├── HeatmapRenderer.js    # [EXISTING]
│   ├── SeismographRenderer.js # [NEW] Seismograph visualization
│   └── SpectrumRenderer.js   # [NEW] FFT spectrum visualization
├── controls/
│   ├── SpeedControl.js       # [EXISTING]
│   ├── SourcesControl.js     # [EXISTING]
│   ├── KeyboardHandler.js    # [EXISTING]
│   ├── MouseHandler.js       # [NEW] Mouse camera controls
│   ├── TouchHandler.js       # [NEW] Touch gesture controls
│   └── RandomnessControl.js  # [NEW] Randomness slider control
├── audio/
│   ├── FFTProcessor.js       # [NEW] Fast Fourier Transform
│   └── AudioAnalyzer.js      # [NEW] Audio analysis utilities
├── pwa/
│   ├── serviceWorker.js      # [NEW] Service worker for PWA
│   └── manifest.json         # [NEW] Web app manifest
├── utils/
│   ├── MathUtils.js          # [EXISTING]
│   └── SignalUtils.js        # [NEW] Signal processing utilities
└── main.js                   # [MODIFIED] Integrate new systems
```

## Implementation Tasks

### 1. PWA Foundation
- Create `manifest.json` with app metadata, icons, and display settings
- Implement `serviceWorker.js` for offline functionality and caching
- Update `index.html` to include PWA meta tags and service worker registration
- Configure PWA build process in Vite

### 2. Enhanced Camera Controls
- Create `MouseHandler.js` for desktop mouse controls:
  - 'e' key toggle for mouse control mode
  - Mouse movement for pan/tilt
  - Scroll wheel for zoom
- Create `TouchHandler.js` for mobile touch controls:
  - Single finger drag for pan/tilt
  - Pinch gestures for zoom
  - Touch event normalization across devices
- Modify `Camera.js` to add zoom functionality
- Integrate mouse/touch handlers with existing keyboard controls

### 3. Randomness System
- Create `RandomnessControl.js` for UI slider control
- Modify `SandPile.js` to implement randomness in avalanche mechanics:
  - Add jitter to sand grain falling direction
  - Implement adjacent column spillover based on randomness factor
  - Maintain deterministic behavior at randomness = 0
- Update simulation parameters to include randomness factor

### 4. Seismograph System
- Create `SeismographData.js` for signal generation:
  - Track rate of change of sand columns
  - Apply distance-based weighting from bottom-left corner
  - Maintain circular buffer for real-time data
- Create `SeismographRenderer.js` for oscilloscope-style display:
  - Real-time waveform rendering
  - Scrolling time-domain visualization
  - Configurable amplitude and time scales
- Add seismograph window to UI layout (bottom-left position)

### 5. Spectrum Analyzer System
- Create `FFTProcessor.js` for frequency analysis:
  - Implement Fast Fourier Transform algorithm
  - Process seismograph signal in real-time
  - Generate frequency domain data
- Create `SpectrumRenderer.js` for waterfall display:
  - Frequency vs time waterfall visualization
  - Color-coded amplitude representation
  - Scrolling frequency history
- Add spectrum window to UI layout (bottom-right position)

### 6. Audio Processing Infrastructure
- Create `SignalUtils.js` for signal processing utilities:
  - Windowing functions (Hamming, Blackman)
  - Signal filtering and normalization
  - Utility functions for audio analysis
- Create `AudioAnalyzer.js` for coordinating audio analysis:
  - Manage FFT processing pipeline
  - Handle sampling rate and buffer management
  - Coordinate between seismograph and spectrum systems

### 7. UI Layout Updates
- Modify `index.html` to accommodate new windows:
  - Reorganize layout for seismograph (bottom-left)
  - Add spectrum analyzer space (bottom-right)
  - Maintain responsive design for mobile devices
  - Add randomness slider to controls panel
- Update CSS for new layout components:
  - Seismograph window styling
  - Spectrum analyzer window styling
  - Mobile-responsive adjustments
  - Dark theme consistency

### 8. Integration & Testing
- Modify `main.js` to integrate all new systems:
  - Initialize mouse/touch handlers
  - Connect randomness control to simulation
  - Set up seismograph and spectrum renderers
  - Coordinate real-time data flow
- Add comprehensive error handling for new features
- Implement graceful degradation for unsupported features
- Test PWA installation and offline functionality

### 9. Performance Optimization
- Optimize FFT processing for real-time performance
- Implement efficient rendering for seismograph/spectrum displays
- Add performance monitoring for new audio processing
- Ensure smooth operation on mobile devices
- Optimize memory usage for continuous audio analysis

### 10. Mobile & Touch Optimization
- Test and refine touch gesture recognition
- Optimize UI layout for various screen sizes
- Ensure PWA works well on mobile browsers
- Add touch-friendly control sizing
- Test installation on mobile home screens

## Technical Considerations

- **PWA Compliance**: Ensure all PWA requirements are met for app store distribution
- **Real-time Processing**: Maintain 30-60 FPS while processing audio analysis
- **Memory Management**: Efficient circular buffers for continuous data streams
- **Touch Responsiveness**: Smooth gesture recognition without conflicting with browser navigation
- **Audio Performance**: Optimize FFT calculations to avoid blocking the main thread
- **Cross-platform**: Ensure consistent behavior across desktop and mobile platforms
- **Accessibility**: Maintain keyboard navigation and screen reader compatibility

## Success Criteria

- Installable PWA that works offline
- Smooth mouse and touch camera controls
- Real-time seismograph displaying sand column activity
- Working FFT spectrum analyzer with waterfall display
- Randomness control affecting avalanche behavior
- Responsive design working on desktop and mobile
- Performance maintaining 30+ FPS with all features active
- Successful installation and operation on mobile devices

## Dependencies

- **Existing**: Three.js for 3D rendering, Vite for build system
- **New**: None required - will implement FFT and signal processing from scratch to avoid dependencies

This plan builds upon the existing Phase 1 foundation while adding significant new functionality for PWA capabilities, enhanced interaction, and real-time audio-visual analytics.