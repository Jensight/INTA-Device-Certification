const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const htmlMinifier = require('html-minifier').minify;
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
module.exports = {
    mode: 'development',
    target: 'node',
    entry: './server/server.js',
    output: {
        path: path.resolve(__dirname, 'frameWork-dev-build'),
        filename: 'server.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            }
        ],
    },
    plugins: [
    new webpack.DefinePlugin({
    'process.env.BUILD': JSON.stringify(true)
    }),
    new CleanWebpackPlugin(),  // cleans the build folder each time before build 
    // new CopyPlugin({
    //     patterns: [
    //         {
    //             from: 'server/utils/templates',
    //             to: 'utils/templates',
    //             transform(content) {
    //                 try {
    //                     return htmlMinifier(content.toString(), {
    //                         collapseWhitespace: true,
    //                         removeComments: true,
    //                         removeRedundantAttributes: true,
    //                         useShortDoctype: true
    //                     });
    //                 } catch (error) {
    //                     console.error("Error during HTML minification:", error);
    //                     return content;
    //                 }
    //             }
    //         },
    //     ],
    // }),
    new CopyPlugin({
        patterns: [
            {
                from: 'server/utils/templates',
                to: 'utils/templates',
                transform(content) {
                    const contentAsString = content.toString();    
                    try {
                        const minifiedContent = htmlMinifier(contentAsString, {
                            collapseWhitespace: true,
                            removeComments: true,
                            removeRedundantAttributes: true,
                            useShortDoctype: true
                        });
                        return minifiedContent;
                    } catch (error) {
                        console.error("Error during minification:", error);
                    }
    
                    return contentAsString;
                },
                
            },
            {
                from: 'script/development',
                to: 'script/development',
            },
        ],
    }),
    
    ],
    externals: [nodeExternals()],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin()],
    },
};

