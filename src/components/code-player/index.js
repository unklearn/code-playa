import React from 'react';

import {UnControlled as CodeMirror} from 'react-codemirror2';
import BaseComponent from 'shared/BaseComponent';
import { applyBatchedChangesWithRAF } from './ApplyChanges';
import ControlBar from './ControlBar';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/mdn-like.css';

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
			initialValue: props.initialValue,
			changeSets: props.changeSets
		};
		this.autoBind();
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
		return (
			<div>
				{/*<CodeMirror
					editorDidMount={this.initEditor}
					value={this.state.initialValue}
					options={{
						indentUnit: 4,
						lineNumbers: true,
						theme: 'mdn-like'
					}}
				/>*/}
				<ControlBar/>
				<button onClick={this.og}>
					Ok
				</button>
			</div>
		);
	}

	async og() {
		// import('codemirror/mode/javascript/javascript').then(() => {
		// 	this.instance.setOption('mode', 'javascript');
		// });
		await import('codemirror/mode/go/go').then(() => {
			this.instance.setOption('mode', 'text/x-go');
		});
		this.instance.setOption('readOnly', true);
		this.instance.setValue(this.state.initialValue || '');
		this.playing = true;
		applyBatchedChangesWithRAF(this.instance, this.state.changeSets, 10, () => {
			this.state.initialValue = this.instance.getValue();
			this.instance.setOption('readOnly', false);
			this.state.changeSets = [];
			this.playing = false;
		});
	}
}