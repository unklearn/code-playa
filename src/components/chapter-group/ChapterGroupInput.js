import React from 'react';
import './ChapterGroup.css';

export default function ChapterGroupInput(props) {
	const {
		placeholder,
		text,
		onSave
	} = props;
	return (
		<textarea 
			className='unk-cb-chapter-group__input'
			aria-label='Chapter group title'
			placeholder={placeholder}
			defaultValue={text}
			onBlur={(e) => onSave(e.target.value)}
		/>
	);
};