import React from 'react';
import './Sidebar.css';

/**
 * Sidebar for putting children
 */
export default function Sidebar(props) {
	return (
		<aside className="unk-cb-sidebar">
			{props.children}
		</aside>
	);
};