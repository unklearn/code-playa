import React from 'react';

import {UnControlled as CodeMirror} from 'react-codemirror2';
import BaseComponent from 'shared/BaseComponent';
// import { ChangeRecordStream } from './ApplyChanges';
import ControlBar from './ControlBar';
import { ChangeStream, compressStream } from './change-stream';
import CodeMirrorEditorWrapper from './CodeMirrorEditorWrapper';
import { RecordingsList } from './recordings-list';
import { ReactComponent as CodePlayaLogo } from '../../assets/codeplaya_black.svg';
import CPDWriter from 'components/cpd/DataLoader';
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
			recordings: [],
			currentRecordingIndex: 0,
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
		let editor = new CodeMirrorEditorWrapper(this.instance, this.addChange)
		this.setState({
			editor
		}, () => {
			if (this.state.changeSets && this.state.changeSets.length) {
				this.handlePlay('playing');
			}
		});
	}

	async loadDataIfNecessary() {
		let match = /data-uri=([^&]*)/.exec(window.location.search);
		if (match && match[1]) {
			this.setState({
				loading: true
			});
			const url = match[1];
			let response = await fetch(url);
			let text = await response.text();
			let { options, recording } = CPDWriter.parse(text);
			if (options.speed) {
				this.setOption({ key: 'speed', value: options.speed });
			}
			if (options.mode) {
				this.setOption({ key: 'mode', value: options.mode, directory: options.directory });
			}
			if (recording) {
				this.setState({
					initialValue: '',
					changeSets: recording
				});
			}
			this.setState({
				loading: false
			});
		}
	}

	componentWillUnmount() {
		const {
			stream
		} = this.state;
		if (stream) {
			// Switch off listeners
			stream.off('progress');
			stream.off('playing');
			stream.off('paused');
			// CM instance GC
			stream = null;
		}
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
			speed,
			initialized,
			playState,
			progress,
			changeSets,
			recordState,
			recordings,
			loading,
			initialValue
		} = this.state;
		return (
			<div className='unk-code-playa'>
				<div style={{
					background: '#1d1d1d',
					height: (Math.min(300, window.innerHeight - 50)) + 'px',
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
				<RecordingsList recordings={recordings} handleRecordingAction={this.handleRecordingAction}/>
				{!initialized && !loading && <div className='unk-code-playa__logo' onClick={this.startPlayer}>
					<CodePlayaLogo/>
				</div>}
				{loading && <div className='unk-code-playa__logo' onClick={this.startPlayer}>
					<div className='unk-code-playa__spinner lds-dual-ring'></div>
				</div>}
				{initialized && <ControlBar 
					options={{
						mode,
						speed
					}}
					download={this.handleDownload}
					changeSetCount={changeSets.length}
					toggleRecordState={this.toggleRecordState}
					recordState={recordState}
					progress={progress}
					playState={playState}
					setProgress={this.setProgress}
					setOption={this.setOption}
					onPlayChange={this.handlePlay}
				/>}
				{this.state.cpd && <pre className='cpd-file'>{this.state.cpd}</pre>}
			</div>
		);
	}

	async startPlayer() {
		await this.loadDataIfNecessary();
		this.setState({
			initialized: true
		});
	}
	
	toggleRecordState() {
		let {
			recordState,
			recordings,
			initialValue,
			editor,
			changeSets,
			currentRecordingIndex
		} = this.state;
		if (recordState === 'recording') {
			recordings.push({
				initialValue,
				changeSets
			});
			currentRecordingIndex = recordings.length - 1;
		} else {
			initialValue = editor.getValue();
			changeSets = [];
		}
		this.setState({
			recordState: this.state.recordState === 'recording' ? 'stop' : 'recording',
			currentRecordingIndex,
			recordings,
			initialValue,
			changeSets
		});
	}

	handleRecordingAction({ initialValue, changeSets }, action, index) {
		if (action === 'run') {
			this.setState({
				initialValue,
				currentRecordingIndex: index,
				changeSets,
				stream: null
			}, () => {
				this.state.editor.setValue(initialValue);
				this.handlePlay('playing');
			});
		} else if (action === 'compress') {
			let compressed = compressStream(changeSets, 2);
			this.setState({
				changeSets: compressed
			});
			if (this.state.stream) {
				this.state.stream.apply(initialValue, compressed);
				this.setProgress(0);
			}
		}
	}

	handleDownload() {	
		const cpd = CPDWriter.write(this.state.changeSets, {
			mode: this.state.mode,
			speed: this.state.speed,
			directory: this.state.directory
		});
		this.setState({
			cpd
		});
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
			if (this.state.stream) {
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
				mode,
				directory
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
			speed,
			editor
		}	= this.state;
		// Freeze changes unless user unlocks it.
		editor.freeze();
		// Create new change stream
		let stream = new ChangeStream(
			editor,
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