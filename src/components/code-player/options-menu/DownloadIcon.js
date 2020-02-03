import React from 'react';
import PropTypes from 'prop-types';

export default function DownloadIcon(props) {
	return (
		<svg className="unk-code-playa-options-menu__download-icon" xmlns="http://www.w3.org/2000/svg" onClick={props.onClick} width="24" height="24" viewBox="0 0 24 24" fill="#f3f3f3">
			<title>
				download
			</title>
			<path d="M17 12v5H3v-5H1v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5z"/>
			<path d="M10 15l5-6h-4V1H9v8H5l5 6z"/>
		</svg>							
	);
}

DownloadIcon.propTypes = {
	onClick: PropTypes.func
};