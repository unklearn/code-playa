import React from 'react';
import ChapterGroup from './ChapterGroup';

export default function NewChapterGroup(props) {
	return (
		<div className='unk-cb-new-chapter-group'>
			<div role='button' className='unk-cb-new-chapter-group__add-button' aria-label='Create a new chapter group'>
				<ChapterGroup chapters={[]} editing={true} />
			</div>
		</div>
	);
};