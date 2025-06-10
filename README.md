# Sandquake 🏔️

**Interactive 3D simulation of a modified Abelian sandpile model with real-time seismic analysis and professional AC coupling!**

*The hyperbole below is from Claude Code, which (with the help of Playwright MCP) did all the grunt work. But apart from a bit of roughness around the edges - brown sand - it does mostly work. If you refresh the page.*

Sandquake is a cutting-edge web application that visualizes the fascinating dynamics of sandpile physics through multiple synchronized displays, featuring professional-grade seismograph monitoring and frequency spectrum analysis.

![Sandquake Screenshot](https://github.com/danja/sandquake/blob/main/docs/screenshot.png)

## ✨ Features

### 🎮 Interactive 3D Simulation
- **Real-time 3D visualization** using Three.js
- **Dynamic camera controls** with keyboard, mouse, and touch support
- **Configurable sand sources** with real-time addition/removal
- **Avalanche physics** with adjustable randomness factor
- **Speed control** for simulation rate adjustment

### 📊 Professional Analysis Tools
- **AC-Coupled Seismograph**: Real-time seismic activity monitoring with professional AC coupling
- **Logarithmic Spectrum Analyzer**: Waterfall frequency analysis with scientific notation scaling
- **Heat Map Display**: Top-down visualization of sand height distribution
- **Multi-window Layout**: Four synchronized visualization panels

### 📱 Cross-Platform PWA
- **Progressive Web App** with offline functionality
- **Touch-optimized** for mobile and tablet devices
- **Responsive design** adapting to all screen sizes
- **Installable** directly from browser to home screen

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern web browser with WebGL support

### Installation & Development
```bash
# Clone the repository
git clone <repository-url>
cd sandquake

# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:5173/

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Usage

### Controls
- **Arrow Keys**: Pan (←→) and tilt (↑↓) camera
- **E Key**: Toggle mouse control mode
- **Mouse**: Pan, tilt, and zoom when enabled
- **Touch**: Single finger pan/tilt, pinch to zoom
- **Speed Slider**: Adjust simulation rate (0-5x)
- **Randomness Slider**: Control avalanche scatter (0-100%)
- **Source Controls**: Add/remove sand sources dynamically

### Display Windows
1. **3D Scene** (main): Interactive 3D sandpile visualization
2. **Heat Map** (top-right): Color-coded height distribution
3. **Seismograph** (bottom-left): Real-time AC-coupled seismic monitoring
4. **Spectrum Analyzer** (bottom-right): Logarithmic frequency waterfall display

## 🔬 Technical Architecture

### Core Simulation
- **Abelian Sandpile Model**: Mathematically rigorous cellular automaton
- **Cellular Automaton**: Grid-based physics with critical mass thresholds
- **Distance-Weighted Signals**: Seismic sensitivity based on proximity to monitoring point
- **Real-time Processing**: 60 FPS simulation with 30 FPS display optimization

### Signal Processing
- **AC Coupling**: Professional-grade DC removal using 2-second rolling buffer
- **FFT Analysis**: Complete Cooley-Tukey implementation for spectrum analysis
- **Windowing**: Hamming window function for improved frequency resolution
- **Smoothing**: Exponential averaging for stable display

### Graphics & Rendering
- **Three.js**: WebGL-based 3D rendering with optimized shaders
- **Canvas 2D**: High-performance 2D displays for analysis tools
- **Responsive Design**: Automatic scaling and layout adaptation
- **Performance Optimization**: Maintains 30+ FPS with all features active

## 📁 Project Structure

```
sandquake/
├── src/
│   ├── audio/           # FFT processing and signal analysis
│   ├── controls/        # Input handlers (keyboard, mouse, touch)
│   ├── core/           # Simulation engine and physics
│   ├── graphics/       # Renderers and visualization
│   └── utils/          # Mathematical utilities
├── docs/
│   ├── plans/          # Development phases and progress
│   └── jsdoc/          # Generated API documentation
├── public/             # PWA assets and service worker
└── index.html          # Main application entry point
```

### Key Components
- **`Simulation.js`**: Core sandpile physics engine
- **`SeismographData.js`**: Real-time signal generation with AC coupling
- **`SeismographRenderer.js`**: Professional oscilloscope-style display
- **`SpectrumRenderer.js`**: Logarithmic waterfall frequency visualization
- **`FFTProcessor.js`**: Complete FFT implementation with windowing
- **`SandPile.js`**: Cellular automaton with configurable randomness

## 🧪 Testing

The application uses manual testing protocols:

```bash
# Start development server
npm run dev

# Test checklist:
# ✅ Camera controls (keyboard arrows)
# ✅ Mouse controls (E key toggle)
# ✅ Touch gestures (mobile)
# ✅ UI controls (sliders, buttons)
# ✅ Real-time displays (seismograph, spectrum)
# ✅ PWA functionality (offline, installable)
```

## 🎨 Visualization Details

### Seismograph Display
- **AC Coupling**: Eliminates DC drift like professional equipment
- **Fixed Scale**: Stable -2.0 to +2.0 range prevents auto-scaling issues
- **Event Sensitivity**: 5x amplification reveals subtle seismic activity
- **Real-time Response**: Immediate display of avalanche events

### Spectrum Analyzer
- **Logarithmic Scaling**: Scientific notation (10^x) for wide dynamic range
- **Waterfall Display**: Time vs frequency with color-coded amplitude
- **Long-term Analysis**: Perfect complement to real-time seismograph
- **Smooth Scrolling**: Efficient pixel manipulation for fluid updates

## 🛠️ Development Phases

- **Phase 1** ✅: Core 3D simulation with basic controls
- **Phase 2** ✅: PWA features, advanced controls, seismograph, and spectrum analysis
- **Phase 2.1** ✅: Logarithmic scaling enhancements and AC coupling

See [`docs/plans/`](docs/plans/) for detailed implementation progress.

## 🌐 Browser Support

### Recommended
- Chrome 90+ (best performance)
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- WebGL 2.0 support
- ES6 modules
- Canvas 2D API
- Service Worker (for PWA features)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔬 Scientific Background

The Abelian sandpile model, introduced by Bak, Tang, and Wiesenfeld, demonstrates **self-organized criticality** - a phenomenon where complex systems naturally evolve toward a critical state exhibiting scale-invariant behavior. Sandquake provides an interactive platform for exploring these fascinating dynamics with real-time analysis tools.

### Key Concepts
- **Critical Mass**: Each cell has a threshold (typically 4) that triggers avalanches
- **Conservation**: Sand is conserved during redistribution to neighbors
- **Abelian Property**: Order of operations doesn't affect final state
- **Scale Invariance**: Avalanches exhibit power-law size distributions

## 📚 References

- Bak, P., Tang, C., & Wiesenfeld, K. (1987). "Self-organized criticality: An explanation of the 1/f noise"
- Dhar, D. (1990). "Self-organized critical state of sandpile automaton models"
- Modern web development with Three.js and Canvas APIs
- Professional seismograph design principles

---

**Built with ❤️ using modern web technologies**