import React from 'react';

export default function Recording(props) {
    const {
        index,
        recording,
        handleRecordingAction
    } = props;
    return (
        <li className='unk-code-playa-recording'>
            <span className='unk-code-playa-recording__label'>{'Recording ' + (index + 1)}</span>
            <span className='unk-code-playa-recording__action' onClick={() => handleRecordingAction(recording, 'run', index)}>r</span>
            <span className='unk-code-playa-recording__action' onClick={() => handleRecordingAction(recording, 'compress', index)}>c</span>
            <span className='unk-code-playa-recording__action' onClick={() => handleRecordingAction(recording, 'delete', index)}>d</span>
        </li>
    );
}