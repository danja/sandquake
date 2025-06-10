# Phase 2

## System

* the app will be built as a PWA

## UI 

* on a desktop device, the 'e' key will enable/disable mouse movement control of the pan and tilt of the camera view of the main rendering, with the scroll wheel controlling zoom
* on a touch screen device, drags on the rendering will control pan & tilt, pinch gestures will control zoom
* a "Randomness" slider will be added
* a small seismograph window will be added to the bottom-left corner, showing an oscilloscope-like display
* a small spectrum window will be added to the bottom-right corner showing a waterfall display of frequencies

## Simulation

* the randomness factor will introduce jitter into to the cascade effect, so sand grains may fall onto adjacent vertical columns
* the simulated seismograph will show the rate of change of z columns, weighted by their distance from the bottom-left corner
* the spectrum window will be an FFT of the seismograph signal
