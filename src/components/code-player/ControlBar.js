import React from 'react';
import PlayButton from './play-button/PlayButton';
import ProgressBar from './progress-bar';
import BaseComponent from 'shared/BaseComponent';
import { OptionsMenu, DownloadIcon } from './options-menu';
import RecordButton from './record-button/RecordButton';
import './ControlBar.css';
let iframe = false;
if (window.top!=window.self)
{
  // In a Frame or IFrame
  iframe = true;
}
else
{
  // Not in a frame
  iframe = false;
} 

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
						<PlayButton
							playState={this.props.playState}
							onClick={this.props.onPlayChange}
							disabled={this.props.recordState === 'recording'}
						/>
						<RecordButton
							toggleRecordState={this.props.toggleRecordState}
							recordState={this.props.recordState}
						/>
					</div>
					<div className='unk-code-playa-control-bar__cell unk-code-playa-control-bar__cell--right'>
						<a className='unk-code-playa__about' href="https://unklearn.github.io/code-playa/">About</a>
						{!iframe && <DownloadIcon onClick={this.props.download}/>}
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