const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	entry: "./src/index",
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/
			},
			{
				// Pack images (e.g. when importing a dependency's css)
				test: /\.(jpe?g|png|gif|svg|ico)$/,
				use: [
					"file-loader?name=[hash].[name].[ext]&esModule=false",
					"image-webpack-loader?bypassOnDebug"
				]
			},
			{
				// SCSS: Compile to CSS, inject CSS in index.html (style-loader)
				test: /\.scss$/,
				use: ["style-loader", "css-loader?sourceMap", "sass-loader?sourceMap"]
			}
		]
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	plugins: [
			new HtmlWebpackPlugin({
				template: "src/index.html",
				favicon: "src/image/favicon.ico"
			}),
			new CopyWebpackPlugin([{
				from: "./src/menu.html",
				to: ""
			}])
	],
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "dist")
	},
	devtool: "inline-source-map",
	devServer: {
		contentBase: "./dist"
	},
	mode: "development"
};
