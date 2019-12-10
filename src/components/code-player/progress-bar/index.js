import React, { useState, useEffect } from 'react';
import DraggableHandle from './DraggableHandle';
import './ProgressBar.css';


/**
 * Shows the progress of the player. User can readjust the player position by dragging the handle
 * to the left or right. If checkpoints are defined on the player, we render those checkpoints on
 * the progress bar (tappable points.).
 */
export default function ProgressBar(props) {
	const [progress, setProgress] = useState(props.progress);
	useEffect(() => {
		setProgress(props.progress);
	}, [props.progress]);
	function handleProgressClick(e) {
		const bbox = e.target.closest('.unk-code-playa-progress-bar').getBoundingClientRect();
		let p = (e.clientX - bbox.left ) / (bbox.width);
		props.setProgress(p);
	}
	return (
		<div className='unk-code-playa-progress-bar' onClick={handleProgressClick}>
			{/*
				The handle that is draggable
			*/}
			<span className='unk-code-playa-progress-bar__progress-handle' style={{
				width: (progress * 100) + '%'
			}}/>
			<DraggableHandle progress={progress} onFinish={setProgress}/>
		</div>
	);
}

ProgressBar.defaultProps = {
	progress: 0
};