import React from 'react';

import {UnControlled as CodeMirror} from 'react-codemirror2';
import BaseComponent from 'shared/BaseComponent';
// import { ChangeRecordStream } from './ApplyChanges';
import ControlBar from './ControlBar';
import { ChangeStream } from './change-stream';
import CodeMirrorEditorWrapper from './CodeMirrorEditorWrapper';
import { ReactComponent as CodePlayaLogo } from '../../assets/codeplaya_black.svg';
import 'codemirror/lib/codemirror.css';
import 'assets/monokai.css';

export class CodeMirrorPlayer extends BaseComponent {
	// *********************************************************
	// Static properties
	// *********************************************************
	static defaultProps = {
		initialValue: '',
		changeSets: []
	};
	// *********************************************************
	// Constructor
	// *********************************************************
	constructor(props, ...args) {
		super(props, ...args);
		// Underlying CodeMirror instance
		this.instance = null;
		this.state = {
			mode: 'text/x-go',
			theme: 'monokai',
			playState: 'paused',
			progress: 0,
			speed: 1,
			initialized: false,
			initialValue: props.initialValue,
			changeSets: props.changeSets
		};
		this.autoBind();
		this.setMode('go/go', 'text/x-go');
	}

	/**
	 * Initialize the code mirror editor instance to listen to changes, if we are in editing mode.
	 * @param  {CodeMirror} cm  Codemirror instance
	 */
	initEditor(cm) {
		this.instance = cm;
		if (this.props.editing) {
			// Setup event listeners and record changesets
			cm.on("beforeSelectionChange", (editor, selection) => {
				if (this.state.playState === 'playing') {
					return;
				}
				// Get first range from selection
				let range = selection.ranges[0];
				if (!range || !range.anchor || !range.head) {
					return;
				}
			  if (range.anchor.line === range.head.line && range.anchor.ch === range.head.ch) {
					return;
			  }
			  this.addChange({
		    	origin: "+select",
		      range: range
		    });
			});

			// Store series of changes
			cm.on("changes", (cm, changes) => {
				if (this.state.playState === 'playing') {
					return;
				}
				changes.forEach((change) => {
					this.addChange(change);
			  });
			});
		}
	}

	componentDidUpdate(prevProps) {
		
	}

	/**
	 * Add a changeset
	 * @param  {Object} change Apply change
	 */
	addChange(change) {
		// We do not want to re-render
		if (!this.playing) {
			this.state.changeSets.push({
				change,
				time: Date.now()
			});
		}
	}

	/**
	 * Public function that is invoked by parent to get a snapshot of changes from given checkpoint
	 * These changes will be used to replay user actions.
	 * 
	 * @return {[type]} [description]
	 */
	getSnapshot() {

	}

	// *********************************************************
	// React methods
	// *********************************************************
	render() {
		const {
			theme,
			mode,
			initialized,
			playState,
			progress,
			initialValue
		} = this.state;
		return (
			<div className='unk-code-playa'>
				<div style={{
					background: '#1d1d1d',
					height: 300,
					pointerEvents: initialized ? 'all' : 'none'
				}}>
				{initialized && <CodeMirror
					editorDidMount={this.initEditor}
					value={initialValue}
					options={{
						indentUnit: 4,
						lineNumbers: true,
						mode,
						theme
					}}
				/>}
				</div>
				{!initialized && <div className='unk-code-playa__logo' onClick={() => this.setState({ initialized: true })}>
					<CodePlayaLogo/>
				</div>}
				{initialized && <ControlBar 
					options={{
						mode
					}}
					progress={progress}
					playState={playState}
					setProgress={this.setProgress}
					setOption={this.setOption}
					onPlayChange={this.handlePlay}
				/>}
			</div>
		);
	}

	setProgress(progress) {
		let {
			changeSets,
			stream
		} = this.state;
		const end = changeSets[changeSets.length - 1].time;
		const start = changeSets[0].time;
		if (this.state.playState === 'playing') {
			stream.pause();
			stream.reset((end - start) * progress + start);
		} else {
			stream.reset((end - start) * progress + start);
		}
		this.setState({
			progress
		});
	}

	setOption({ key, value, directory } = {}) {
		if (key === 'mode') {
			this.setMode(directory, value);
		} else if (key === 'speed') {
			if (this.stream) {
				this.state.stream.setSpeed(value);
			}
			this.setState({
				speed: value,
				playState: 'paused'
			});
		}
	}

	async setMode(directory, mode) {
		await import(`codemirror/mode/${directory}`).then(() => {
			this.setState({
				mode
			}, () => {
				if (this.instance) {
					this.instance.setOption('mode', mode);
				}
			});
		});
	}

	async loadStream() {
		const {
			isPlaybackMode,
			streamSource,
			initialValue,
			changeSets,
			speed
		}	= this.state;
		let stream = new ChangeStream(
			new CodeMirrorEditorWrapper(this.instance),
			{
				speed
			}
		);
		// Setup event listeners for play/pause && progress
		stream.addListener('progress', (p) => {
			this.setState({
				progress: p
			});
		});
		stream.addListener('playing', () => {
			this.setState({
				playState: 'playing'
			});
		});
		stream.addListener('paused', () => {
			this.setState({
				playState: 'paused'
			});
		});
		if (isPlaybackMode) {
			// Load stream off source (synchronous for now), we will use a JSON source
			let { i, cs } = JSON.parse(streamSource);
			this.setState({
				initialValue: i,
				changeSets: cs
			});
			stream.apply(i, cs);
		} else {
			stream.apply(initialValue, changeSets);
		}
		return stream;
	}

	async handlePlay(state) {
		// Check if we have a stream available ? Even if it is loading.
		let {
			stream
		} = this.state;
		if (!stream) {
			// Create a new stream, or wait for it to load (if we are playing a local/remote stream)
			stream = await this.loadStream();
		}
		if (state === 'playing') {
			stream.play();
		} else {
			stream.pause();
		}
		this.setState({
			playState: state,
			stream
		});
	}
}