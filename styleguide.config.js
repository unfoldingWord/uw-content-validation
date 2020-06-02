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
		name: 'Resource Checker',
		components: () => {
			const componentNames = [
				'repo-checker',
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
				'content-check-repo',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/components/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'Scripture Burrito Checker',
		components: () => {
			const componentNames = [
				'content-check-repo',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/components/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'Resource Container Checker',
		components: () => {
			const componentNames = [
				'content-check-repo',
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
				'content-check-repo',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/components/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'Table Line (TSV) Checker',
		components: () => {
			const componentNames = [
				'content-check-repo',
			];
			return componentNames.map(componentName => {
				const filename = upperFirst(camelCase(componentName));
				return path.resolve(__dirname, `src/components/${componentName}`, `${filename}.js`)
			});
		}
	},
	{
		name: 'Core functions',
		content: 'src/core/README.md',
		sections: [
			{
				name: 'Basic text check',
				content: 'src/core/basic-text-check.md'
				// description: ''
			},
			{
				name: 'Basic link check',
				content: 'src/core/basic-link-check.md'
				// description: ''
			},
			{
				name: 'TSV table line check',
				content: 'src/core/tsv-table-line-check.md'
				// description: ''
			},
			{
				name: 'TSV table check',
				content: 'src/core/tsv-table-text-check.md'
				// description: ''
			},
			// {
			// 	name: 'USFM text check',
			// 	content: 'src/core/usfm-text-check.md'
			// 	// description: ''
			// },
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

