const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const rules = require('./node_modules/paraviewweb/config/webpack.loaders.js');
const plugins = [
    new HtmlWebpackPlugin({
        inject: 'body',
    }),
];

const entry = path.join(__dirname, './src_client/index.js');
const outputPath = path.join(__dirname, './dist');
const styles = path.resolve('./node_modules/paraviewweb/style');

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
            { test: entry, loader: "expose-loader?MyWebApp" },
            {
                test:/\.js$/,
                loader:'babel-loader',
                include:path.join(__dirname,'src_client'),
                exclude:/node_modules/
            },
        ].concat(rules),
    },
    resolve: {
        alias: {
            PVWStyle: styles,
        },
    },
    node: {
        fs: "empty",
        net: 'empty',
    },
};
// devServer: {
//     contentBase: './dist/',
//         port: 9999,
// },