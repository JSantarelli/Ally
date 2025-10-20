import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import Dotenv from 'dotenv-webpack';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default {
  mode: 'development',
  entry: './src/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'public'),
      publicPath: '/'
    },
    port: 8080,
    hot: true,
    open: {
      app: {
        name: 'Google Chrome'
      }
    }
  },
  plugins: [
  new Dotenv(),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
        type: 'asset/resource'
      },
      {
        test: /\.geojson$/,
        type: 'asset/resource'
      },
      {
        test: /\.txt$/,
        use: "raw-loader"
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.geojson', '.txt']
  }
};