import React from 'react';
import PlayButton from './play-button/PlayButton';
import ProgressBar from './progress-bar';
import BaseComponent from 'shared/BaseComponent';
import { OptionsMenu } from './options-menu';
import RecordButton from './record-button/RecordButton';
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
				<ProgressBar
					progress={this.props.progress}
					setProgress={this.props.setProgress}
				/>
				<div className='unk-code-playa-control-bar__row'>
					<div className='unk-code-playa-control-bar__cell unk-code-playa-control-bar__cell--left'>
						{this.props.recordState === 'stop' && <PlayButton
							playState={this.props.playState}
							onClick={this.props.onPlayChange}
						/>}
					</div>
					<div className='unk-code-playa-control-bar__cell unk-code-playa-control-bar__cell--right'>
						<RecordButton
							toggleRecordState={this.props.toggleRecordState}
							recordState={this.props.recordState}
						/>
						<OptionsMenu
							options={this.props.options}
							setOption={this.props.setOption}
						/>
					</div>
				</div>
			</div>
		);
	}
};