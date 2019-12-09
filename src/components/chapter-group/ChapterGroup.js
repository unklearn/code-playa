import React from 'react';
import PropTypes from 'prop-types';
import ChapterGroupInput from './ChapterGroupInput';
import './ChapterGroup.css';

/**
 * Chapter group represents a logical grouping of chapters
 */
export default function ChapterGroup(props) {
	const {
		title,
		editing,
		placeholder,
		chapters
	} = props;
	return (
		<nav className='unk-cb-chapter-group'>
			{!editing ? <h4 className='unk-cb-chapter-group__title'>
				{title}
			</h4> : <ChapterGroupInput placeholder={placeholder} text={title} onSave={console.log}/>}
			<ul className='unk-cb-chapter-group__list'>
				{chapters.map((chapter) => (
					<li className='unk-cb-chapter-group__list-item' key={chapter.id}>
						<a className='unk-cb-chapter-group__link' href={`/chapters/${chapter.id}`}>
							{chapter.label}
							<button>
							Edit
							</button>
							<button>
							+
							</button>
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
};

ChapterGroup.propTypes = {
	// The title of the chapter group
	title: PropTypes.string,
	// Whether the user is editing the chapter group is not
	editing: PropTypes.bool,
	// Placeholder to show while editing
	placeholder: PropTypes.string,
	// List of chapters in the chapter group
	chapters: PropTypes.arrayOf(PropTypes.shape({
		// The id of the chapter
		id: PropTypes.string,
		// The display name for chapter
		label: PropTypes.string
	}))
};

ChapterGroup.defaultProps = {
	editing: false,
	placeholder: 'New Chapter Group'
};