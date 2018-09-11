/**
 * We must use webpack (and cannot just use tape with @babel/register) as babel doesn't support
 * imports – this requires a web packer.
 */

const path = require('path');
const walk = require('walk-sync');
const TapWebpackPlugin = require('tap-webpack-plugin');

const basePath = 'src/js';
const entries = walk('.')
    .filter(name => /\.(unit|integration)\.js$/.test(name))
    //.filter((name) => /infectApp\.integration\.js$/.test(name))
    .filter(item => console.log(item) || true)
    .map(name => path.join(__dirname, name));

console.log('Test', entries.length, 'files');

module.exports = [

    // Tests
    {
        context: path.resolve(__dirname, basePath)
        , target: 'node'
        , mode: 'development'
        /* pass in entry manually */
        , entry: entries
        , output: {
            path: path.resolve(__dirname, 'testOutput')
            , filename: 'test.js'
        }
        , watch: true
        , module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    use: {
                        loader: 'babel-loader',
                        // Don't use .babelrc as it will conflict with the babel config of the root
                        // projects (frontend/app)
                        options: {
                            "plugins": [
                                ["@babel/plugin-proposal-decorators", { "legacy": true }],
                                ["@babel/plugin-proposal-class-properties", { "loose": true }],
                                ["@babel/plugin-proposal-object-rest-spread"]
                            ]
                        }
                    },
                    exclude: /node_modules/,
                },
                // See https://github.com/apollographql/react-apollo/issues/1737#issuecomment-372946515
                {
                    type: 'javascript/auto',
                    test: /\.mjs$/,
                    use: [],
                }
            ]
        }
        , resolve: {
            extensions: ['.js', '.jsx']
        }
        , plugins: [
            new TapWebpackPlugin({ reporter: 'node ./node_modules/tap-spec/bin/cmd' })
        ]

    }

];