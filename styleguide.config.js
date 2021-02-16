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
		name: 'GL Book Package Checker Demo',
		components: () => {
			const componentNames = [
				'gl-book-package-check',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/demos/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'All Book Packages Checker Demo',
		components: () => {
			const componentNames = [
				'all-book-packages-check',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/demos/${componentName}`, `${filename}.js`)
			});
		}
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
		// The difficulty with displaying the various functions this way
		//	is that they all appear and run on a SINGLE web-page.
		name: 'Sample Notice Processing Functions',
		// content: 'src/core/README.md',
		sections: [
			{
				name: 'Process notices -> Prioritised with Colour Gradient',
				content: 'src/demos/notice-processing3.md',
				// description: ''
			},
			{
				name: 'Process notices -> Severe/Medium/Low',
				content: 'src/demos/notice-processing2.md',
				// description: ''
			},
			{
				name: 'Process notices -> Errors/Warnings',
				content: 'src/demos/notice-processing1.md',
				// description: ''
			},
		]
	},
	{
		// The difficulty with displaying core functions this way
		//	is that they all appear and run on a SINGLE web-page.
		name: 'Core Filetype Checking Functions',
		// content: 'src/core/README.md',
		sections: [
			{
				name: 'TWLLinks TSV6 table check',
				content: 'src/core/twl-tsv6-table-check.md',
				// description: ''
			},
			{
				name: 'TQ/SQ TSV7 table check',
				content: 'src/core/questions-tsv7-table-check.md',
				// description: ''
			},
			{
				name: 'TN/SN TSV7 table check',
				content: 'src/core/notes-tsv7-table-check.md',
				// description: ''
			},
			{
				name: 'TN TSV9 table check',
				content: 'src/core/tn-tsv9-table-check.md',
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
				name: 'TWLinks TSV6 row check',
				content: 'src/core/twl-tsv6-row-check.md',
				// description: ''
			},
			{
				name: 'TQ/SQ TSV7 row check',
				content: 'src/core/questions-tsv7-row-check.md',
				// description: ''
			},
			{
				name: 'TN/SN TSV7 row check',
				content: 'src/core/notes-tsv7-row-check.md',
				// description: ''
			},
			{
				name: 'TN TSV9 table row check',
				content: 'src/core/tn-tsv9-row-check.md',
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
    webpackConfig: require('react-scripts/config/webpack.config')('development'),
};

