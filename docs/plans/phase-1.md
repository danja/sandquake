# Phase 1 Implementation Plan - Sandquake

## Overview
Implementation of the core 3D sandpile simulation based on the Abelian sandpile model with real-time controls and Three.js visualization.

## Project Structure

```
src/
├── core/
│   ├── SandPile.js           # Abelian sandpile model logic
│   ├── Simulation.js         # Main simulation controller
│   └── SandSource.js         # Sand source with rate control
├── graphics/
│   ├── Scene.js              # Three.js scene setup
│   ├── Camera.js             # Camera controller with pan/tilt
│   ├── Ground.js             # Ground plane visualization
│   ├── Ceiling.js            # Ceiling plane visualization
│   └── SandRenderer.js       # Sand particle/pile rendering
├── controls/
│   ├── SpeedControl.js       # Speed adjustment control
│   ├── SourcesControl.js     # Sources management control
│   └── KeyboardHandler.js    # Arrow key input handling
├── utils/
│   └── MathUtils.js          # Mathematical utilities
└── main.js                   # Application entry point
```

## Implementation Tasks

### 1. Project Foundation
- Create `index.html` with basic HTML structure and canvas
- Set up `src/main.js` as entry point
- Configure Vite development environment

### 2. Core Simulation Logic
- Implement `SandPile.js` with Abelian sandpile model
  - Grid-based sand accumulation
  - Critical mass detection and avalanche mechanics
  - Sand distribution algorithms
- Create `SandSource.js` for ceiling sources
  - Random position generation
  - Configurable `sandRate` per source
  - Sand dropping mechanism
- Build `Simulation.js` as main controller
  - Manage multiple sand sources
  - Coordinate simulation timesteps
  - Handle real-time parameter updates

### 3. 3D Graphics System
- Set up `Scene.js` with Three.js basics
  - Scene, renderer, lighting setup
  - Ground and ceiling plane creation
- Implement `Camera.js` controller
  - Circular panning around scene
  - Tilt controls (orthogonal to pan)
  - Smooth camera movements
- Create `SandRenderer.js` for visualization
  - Particle systems for falling sand
  - Height-based pile visualization
  - Dynamic mesh updates for avalanches

### 4. User Controls
- Build `SpeedControl.js` for global speed adjustment
  - Real-time rate modification
  - UI slider or input control
- Implement `SourcesControl.js` for source management
  - Add/remove sources dynamically
  - Adjust individual source rates
- Create `KeyboardHandler.js` for camera controls
  - Left/right arrow keys for panning
  - Additional keys for tilt control

### 5. Integration & Polish
- Connect all systems in main application loop
- Add performance optimization for smooth rendering
- Implement proper cleanup and resource management
- Add basic error handling and validation

### 6. Testing Setup
- Create unit tests for core simulation logic
- Add integration tests for graphics systems
- Test control responsiveness and edge cases

### 7. Documentation
- Generate JSDoc documentation
- Create usage examples and API documentation
- Update README with build and run instructions

## Technical Considerations

- **Performance**: Use efficient data structures for grid-based calculations
- **Rendering**: Implement level-of-detail for large sand piles
- **Physics**: Ensure stable timestep for consistent simulation
- **Memory**: Proper cleanup of Three.js objects to prevent leaks
- **Modularity**: Each component should be independently testable

## Success Criteria

- Functional 3D sandpile simulation with avalanche mechanics
- Real-time speed and source controls
- Smooth camera navigation with keyboard controls
- Modular, testable codebase with proper documentation