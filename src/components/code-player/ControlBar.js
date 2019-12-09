import React from 'react';
import PlayButton from './play-button/PlayButton';
import ProgressBar from './progress-bar';
import BaseComponent from 'shared/BaseComponent';
import './ControlBar.css';

export default class ControlBar extends BaseComponent {
	render() {
		return (
			<div className='unk-code-playa-control-bar'>
				{
					/*
						Play / Pause button
					 */
				}
				<ProgressBar/>
				<PlayButton/>

			</div>
		);
	}
};