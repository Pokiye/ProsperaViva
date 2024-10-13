import path from "path";
import Dotenv from "dotenv-webpack";
const __dirname = path.resolve();

export default {
    entry: './src/index.tsx',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public'),
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "views", 'public'),
        },
        compress: true,
        port: process.env.FRONTEND_PORT || 3001,
        open: true,
    },
    plugins: [
        new Dotenv()
    ]
};