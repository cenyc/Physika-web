const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

//const rules = require('./node_modules/paraviewweb/config/webpack.loaders.js');
const plugins = [
    new HtmlWebpackPlugin({
        inject: 'body',
    }),
];

const entry = path.join(__dirname, './src_client/index.js');
const outputPath = path.join(__dirname, './dist');

module.exports = {
    plugins,
    entry,
    output: {
        path: outputPath,
        filename: 'physika-web.js',
        libraryTarget: 'umd',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.join(__dirname, 'src_client'),
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env', '@babel/preset-react'],
                            plugins: ["@babel/plugin-proposal-class-properties"],
                        },
                    },
                ],
            },
            {
                test: /\.js$/,
                include: /node_modules(\/|\\)vtk.js(\/|\\)/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env', '@babel/preset-react'],
                        },
                    },
                ],
            },
            {
                test: /\.worker\.js$/,
                loader: 'worker-loader',
                options: {
                    inline: true,
                    fallback: false
                },
            },
            {
                test: /\.css$/,
                exclude: /\.module\.css$/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader' },
                ],
            },
            {
                test: /\.module\.css$/,
                use: [
                    { loader: 'style-loader' },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                        },
                    },
                ],
            },
            {
                test: /\.glsl$/,
                loader: 'shader-loader',
            },
            {
                test: /\.svg$/,
                use: [{ loader: 'raw-loader' }],
            },
        ]
    },
    node: {
        fs: "empty",
        net: 'empty',
    },
};
