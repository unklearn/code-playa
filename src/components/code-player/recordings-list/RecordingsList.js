import React from 'react';
import Recording from './Recording';
import './RecordingsList.css';

export default function RecordingsList(props) {
    const {
        recordings,
        handleRecordingAction
    } = props;
    return (
        <ul className='unk-code-playa-recordings-list'>
            {recordings.map((r, i) => {
                return <Recording recording={r} index={i} key={i} handleRecordingAction={handleRecordingAction}/>
            })}
        </ul>
    );
}