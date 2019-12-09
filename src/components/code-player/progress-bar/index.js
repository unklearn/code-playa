import React from 'react';
import DraggableHandle from './DraggableHandle';
import './ProgressBar.css';


/**
 * Shows the progress of the player. User can readjust the player position by dragging the handle
 * to the left or right. If checkpoints are defined on the player, we render those checkpoints on
 * the progress bar (tappable points.).
 */
export default function ProgressBar(props) {
	return (
		<div className='unk-code-playa-progress-bar'>
			{/*
				The handle that is draggable
			*/}
			<DraggableHandle restrictY onFinish={console.log}/>
		</div>
	);
}