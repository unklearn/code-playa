import React, { useState } from 'react';
import './PlayButton.css';

export default function PlayButton(props) {
	const [state, setState] = useState('paused');
	return (
		<button tabIndex={0} className={'code-playa-control-bar__button'} onClick={() => state === 'paused' ? setState('playing') : setState('paused')}>
			<svg width="36px" height="36px" viewBox="0 0 36 36" >
        <path d={state === 'paused' ? "M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26" : "M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28"}/>
    </svg>
		</button>
	);
};