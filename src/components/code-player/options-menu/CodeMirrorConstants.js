export const MODES = [{
	name: 'Golang',
	type: 'text/x-go',
	dir: 'go/go'
}, {
  name: 'HTML',
  type: 'text/html',
  dir: 'htmlmixed/htmlmixed'
}, {
  name: 'Python',
  type: 'python',
  dir: 'python/python'
}, {
	name: 'Javascript',
	children: [{
		name: 'Javascript',
		type: 'text/javascript',
		dir: 'javascript/javascript'
	},{
		name: 'JSX',
		type: 'text/jsx',
		dir: 'jsx/jsx'
	}, {
		name: 'JSON',
		type: 'application/json',
		dir: 'javascript/javascript'
	}]
}];

export const THEMES = [
	'3024-day',
  '3024-night',
  'abcdef',
  'ambiance',
  'base16-dark',
  'base16-light',
  'bespin',
  'blackboard',
  'cobalt',
  'colorforth',
  'darcula',
  'dracula',
  'duotone-dark',
  'duotone-light',
  'eclipse',
  'elegant',
  'erlang-dark',
  'gruvbox-dark',
  'hopscotch',
  'icecoder',
  'idea',
  'isotope',
  'lesser-dark',
  'liquibyte',
  'lucario',
  'material',
  'material-darker',
  'material-palenight',
  'material-ocean',
  'mbo',
  'mdn-like',
  'midnight',
  'monokai',
  'moxer',
  'neat',
  'neo',
  'night',
  'nord',
  'oceanic-next',
  'panda-syntax',
  'paraiso-dark',
  'paraiso-light',
  'pastel-on-dark',
  'railscasts',
  'rubyblue',
  'seti',
  'shadowfox',
  'solarized dark',
  'solarized light',
  'the-matrix',
  'tomorrow-night-bright',
  'tomorrow-night-eighties',
  'ttcn',
  'twilight',
  'vibrant-ink',
  'xq-dark',
  'xq-light',
  'yeti',
  'yonce',
  'zenburn'
];