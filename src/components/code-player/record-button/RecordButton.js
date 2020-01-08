import React from 'react';
import './RecordButton.css';

export default function RecordButton(props) {
    const {
        recordState,
        toggleRecordState
    } = props;
    return (
        <button tabIndex={0} className={'code-playa-control-bar__button'} onClick={toggleRecordState}>
            <svg width="36px" height="36px" viewBox="0 0 36 36" >
                {recordState === 'recording' ? (
                    <rect x="12" y="12" width="12" height="12" fill="red">
                        <title>Stop Recording</title>
                    </rect>
                ) : (
                <circle cx="18px" cy="18px" r="5px" fill='#ffda00'>
                <title>Record</title>
            </circle>
                )}
            </svg>
        </button>
    );
};