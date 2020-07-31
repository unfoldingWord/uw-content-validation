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
		name: 'Clear Cache',
		components: () => {
			const componentNames = [
				'clear-cache',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/components/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'Book Packages Checker',
		components: () => {
			const componentNames = [
				'book-packages-check',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/components/${componentName}`, `${filename}.js`)
			});
		}
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
				name: 'Process notices -> Errors/Warnings',
				content: 'src/core/notice-processing1.md',
				// description: ''
			},
			{
				name: 'Process notices -> Severe/Medium/Low',
				content: 'src/core/notice-processing2.md',
				// description: ''
			},
			{
				name: 'Process notices -> colour gradient',
				content: 'src/core/notice-processing3.md',
				// description: ''
			},
			{
				name: 'Basic text field check',
				content: 'src/core/basic-text-check.md',
				// description: ''
			},
			{
				name: 'Basic link check',
				content: 'src/core/basic-link-check.md',
				// description: ''
			},
			{
				name: 'Basic file check',
				content: 'src/core/basic-file-check.md',
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
				name: 'USFM grammar check (from BCS)',
				content: 'src/core/BCS-usfm-grammar-check.md',
				// description: ''
			},
			{
				name: 'USFM-JS check',
				content: 'src/core/usfm-js-check.md',
				// description: ''
			},
			{
				name: 'YAML check',
				content: 'src/core/yaml-text-check.md',
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

