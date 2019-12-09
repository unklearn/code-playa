import React from 'react';

import BaseComponent from 'shared/BaseComponent';

export default class ChapterPlayer extends BaseComponent {
	// *********************************************************
	// React methods
	// *********************************************************
	render() {
		// In edit mode, chapter player enters record mode. From given checkpoint
		// it starts recording changes.
		return (
			<div className='chapter-player'>
				<button>
					Snapshot
				</button>
			</div>
		);
	}
};