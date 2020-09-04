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
		name: 'Book Packages Checker Demo',
		components: () => {
			const componentNames = [
				'book-packages-check',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/demos/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'Book Package Checker Demo',
		components: () => {
			const componentNames = [
				'book-package-check',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/demos/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'Repo Checker Demo',
		components: () => {
			const componentNames = [
				'repo-check',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/demos/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'File Checker Demo',
		components: () => {
			const componentNames = [
				'file-check',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/demos/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'Clear Stored Cache',
		components: () => {
			const componentNames = [
				'clear-cache',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/demos/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		// The difficulty with displaying core functions this way
		//	is that they all appear and run on a SINGLE web-page.
		name: 'Sample Notice Processing Functions',
		content: 'src/core/README.md',
		sections: [
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
			}
		]
	},
	{
		// The difficulty with displaying core functions this way
		//	is that they all appear and run on a SINGLE web-page.
		name: 'Core Filetype Checking Functions',
		// content: 'src/core/README.md',
		sections: [
			{
				name: 'Annotation table check',
				content: 'src/core/annotation-table-check.md',
				// description: ''
			},
			{
				name: 'TN TSV table check',
				content: 'src/core/tn-tsv-table-text-check.md',
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
	},
	{
		// The difficulty with displaying core functions this way
		//	is that they all appear and run on a SINGLE web-page.
		name: 'Core Mid-level Filetype Checking Functions',
		// content: 'src/core/README.md',
		sections: [
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
		]
	},
	{
		// The difficulty with displaying core functions this way
		//	is that they all appear and run on a SINGLE web-page.
		name: 'Core Whole-text Checking Functions',
		// content: 'src/core/README.md',
		sections: [
			{
				name: 'Markdown text check',
				content: 'src/core/markdown-text-check.md',
				// description: ''
			},
			{
				name: 'Basic whole text check',
				content: 'src/core/file-text-check.md',
				// description: ''
			},
			{
				name: 'Plain text check',
				content: 'src/core/plain-text-check.md',
				// description: ''
			},
		]
	},
	{
		// The difficulty with displaying core functions this way
		//	is that they all appear and run on a SINGLE web-page.
		name: 'Core Field Checking Functions',
		// content: 'src/core/README.md',
		sections: [
			{
				name: 'Annotation row check',
				content: 'src/core/annotation-row-check.md',
				// description: ''
			},
			{
				name: 'TN TSV table row check',
				content: 'src/core/tn-tsv-table-row-check.md',
				// description: ''
			},
			{
				name: 'Basic text-field link check',
				content: 'src/core/field-link-check.md',
				// description: ''
			},
			{
				name: 'Basic text-field check',
				content: 'src/core/field-text-check.md',
				// description: ''
			},
		]
	},
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
	components: 'src/demos/**/[A-Z]*.js',
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

