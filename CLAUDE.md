# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sandquake is a 3D simulation of a minimal landscape featuring sandpiles, based on the Abelian sandpile model. It's a Node.js/browser project using ES modules with Vite for build and Vitest for testing.

## Development Commands

- `npm run dev` - Start development server with Vite (runs on http://localhost:5173/)
- `npm run build` - Build the project for production  
- `npm run preview` - Preview the production build

## Testing

Currently uses manual testing. To test the application:
1. Run `npm run dev`
2. Open browser to http://localhost:5173/
3. Test keyboard controls (arrow keys for camera)
4. Test UI controls (speed slider, source buttons)
5. Verify 3D rendering and sand simulation

## Architecture

The project uses Three.js for 3D visualization and follows these key principles:
- ES modules throughout
- Single responsibility per source file
- JSDoc for documentation
- Modular architecture with well-defined component responsibilities

### Core Simulation Concepts

- **Ground and Ceiling**: x-y ground plane with ceiling plane above
- **Sources**: Random points on ceiling with configurable `sandRate` 
- **Sand Physics**: Sand falls and accumulates until critical mass triggers avalanche
- **Real-time Controls**: 
  - "Speed" - adjusts sand falling rate globally
  - "Sources" - manages source point locations
- **Camera System**: Circular panning (left/right arrow keys), tilt controls for scene navigation

### Project Structure

- Plans documented in `docs/plans/` (e.g., `docs/plans/phase-1.md`)
- Progress reports alongside plans (e.g., `docs/plans/phase-1_progress.md`)
- JSDoc documentation generated to `docs/jsdoc/`

## Dependencies

- **three**: 3D graphics library for visualization
- **vite**: Build tool and dev server
- **vitest**: Testing framework