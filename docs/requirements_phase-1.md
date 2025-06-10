# Sandquake

Sandquake is a 3D simulation of a minimal landscape featuring sandpiles, based on the Abelian sandpile model. 

## Implementation Environment

Sandquake is a Node.js/browser project using ES modules with Vite for build and Vitest for unit and integration tests, following common conventions for dir and file/module naming, with JSDoc for source documentation. It follows best practices in terms of modularity with source files each having a single, well-defined responsibility.
3D visualization is achieved using the three.js library.
Plans will be recorded under docs/plans, eg. docs/plans/phase-1.md. Associated with these will be continually updated progress reports, eg. docs/plans/phase-1_progress.md.

## Phase 1

There is a ground x-y plane and above it a ceiling plane. An array of size nPiles contains a point, the Source, on the ceiling together with a value `sandRate`. Sand falls from the ceiling at a rate of new grains proportional to the sandRate value for the given pile. Sand piles up until reaching a critical mass at which point an avalanch will occur.

The simulation has two controls for the sand behaviour which can be adjusted in real time: one "Speed" which adjusts a variable which affects the rate of the sand falling on all the piles, another "Sources". The location of the points in the ceiling, of the Sources, is chosen randomly when the Source is created.  

The visualization gives a camera view of the scene, with left and right pan buttons, linked to the corresponding arrow keys allowing circular panning around the scene, and tilt, a circular view orthogonal to pan.  

