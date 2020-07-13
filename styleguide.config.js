const path = require('path');
const upperFirst = require('lodash/upperFirst');
const camelCase = require('lodash/camelCase');
const { name, version, repository } = require('./package.json');
const { styles, theme } = require('./styleguide.styles');

let sections = [
	{
		name: 'README',
		content: 'README.md',
	},
	{
		name: 'Book Package Checker',
		components: () => {
			const componentNames = [
				'book-package-check',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/components/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'Repo Checker',
		components: () => {
			const componentNames = [
				'repo-check',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/components/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'File Checker',
		components: () => {
			const componentNames = [
				'file-check',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/components/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		// The difficulty with displaying core functions this way
		//	is that they all appear and run on a SINGLE web-page.
		name: 'Core functions',
		content: 'src/core/README.md',
		sections: [
			{
				name: 'Raw text check',
				content: 'src/core/raw-text-check.md',
				// description: ''
			},
			{
				name: 'Notice processing',
				content: 'src/core/notice-processing.md',
				// description: ''
			},
			{
				name: 'Basic text check',
				content: 'src/core/basic-text-check.md',
				// description: ''
			},
			{
				name: 'Basic link check',
				content: 'src/core/basic-link-check.md',
				// description: ''
			},
			{
				name: 'Plain text check',
				content: 'src/core/plain-text-check.md',
				// description: ''
			},
			{
				name: 'Markdown text check',
				content: 'src/core/markdown-text-check.md',
				// description: ''
			},
			{
				name: 'TSV table line check',
				content: 'src/core/tsv-table-line-check.md',
				// description: ''
			},
			{
				name: 'TSV table check',
				content: 'src/core/tsv-table-text-check.md',
				// description: ''
			},
			{
				name: 'USFM text check',
				content: 'src/core/usfm-text-check.md',
				// description: ''
			},
			{
				name: 'Manifest check',
				content: 'src/core/manifest-text-check.md',
				// description: ''
			},
		]
	}
];

module.exports = {
	title: `${upperFirst(camelCase(name))} v${version}`,
	ribbon: {
		url: repository.url,
		text: 'View on GitHub'
	},
	styles,
	theme,
	getComponentPathLine: (componentPath) => {
		const dirname = path.dirname(componentPath, '.js');
		const file = dirname.split('/').slice(-1)[0];
		const componentName = upperFirst(camelCase(file));
		return `import { ${componentName} } from "${name}";`;
	},
	usageMode: 'expand',
	exampleMode: 'expand',
	pagePerSection: true,
	sections,
	components: 'src/components/**/[A-Z]*.js',
	defaultExample: true,
	moduleAliases: {
		'rsg-example': path.resolve(__dirname, 'src'),
	},
	version,
	webpackConfig: {
		module: {
			rules: [
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					loader: 'babel-loader',
				},
				{
					test: /\.css$/,
					loader: 'style-loader!css-loader',
				},
			],
		},
	},
};

