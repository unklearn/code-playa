import React, { useState, useEffect } from 'react';

export default function DraggableHandle(props) {
	const [isDragging, setIsDragging] = useState(false);
	const [pos, setPos] = useState(props.initialPos);
	const [origin, setOrigin] = useState(null);
	function startDrag(e) {
		setIsDragging(true);
		const element = e.target.parentNode;
		const bbox = element.getBoundingClientRect();
		if (origin === null) {
			setOrigin({
				width: bbox.width + 10,
				height: bbox.height,
				x: e.clientX
			});
		}
	}
	useEffect(() => {
		function onDrag(e) {
			if (!isDragging) {
				return;
			}
			setPos(Math.min(Math.max(props.restrictX ? 0 : (e.clientX - origin.x) / (origin.width), 0), 1));
		}
		function endDrag(e) {
			if (!isDragging) {
				return;
			}
			setIsDragging(false);
			if (props.onFinish) {
				props.onFinish(pos);
			}
		}
		if (isDragging) {
			document.addEventListener('mousemove', onDrag);
			document.addEventListener('mouseup', endDrag);
		} else {
			document.removeEventListener('mousemove', onDrag);
			document.removeEventListener('mouseup', endDrag);
		}
		return () => {
			document.removeEventListener('mousemove', onDrag);
			document.removeEventListener('mouseup', endDrag);
		};
	}, [isDragging, props, origin, pos]);
	return (
		<span className='unk-code-playa-progress-bar__handle' 
			onMouseDown={startDrag}
			style={{
				left: 100 * pos + '%'
			}}
		/>
	);
}

DraggableHandle.defaultProps = {
	initialPos: 0
};