// webpack.config.js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    entry: './src/client/js/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        alias: {
            'three': path.resolve('./node_modules/three/build/three.module.js'),
            'three/examples/jsm/controls/TrackballControls': path.resolve('./node_modules/three/examples/jsm/controls/TrackballControls.js')
        }
    },
    mode: 'development',
    devtool: 'source-map'
};