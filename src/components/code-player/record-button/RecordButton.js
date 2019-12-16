import React from 'react';
import './RecordButton.css';

export default function RecordButton(props) {
    const {
        recordState,
        toggleRecordState
    } = props;
    return (
        <div className='unk-code-playa-record-btn'>
            <button tabIndex={0} className={'code-playa-control-bar__button'} onClick={toggleRecordState}>
                <svg width="24px" height="24px" viewBox="0 0 24 24" >
                    {recordState === 'recording' ? (
                        <rect x="6" y="6" width="12" height="12" fill="red">
                            <title>Stop Recording</title>
                        </rect>
                    ) : (
                    <circle cx="12px" cy="12px" r="5px" fill='#ffda00'>
                    <title>Record</title>
                </circle>
                    )}
                </svg>
            </button>
        </div>
    );
};