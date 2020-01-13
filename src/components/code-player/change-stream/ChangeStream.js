import { EventEmitter } from 'fbemitter';
import { delay, asyncForEach } from './Utils';

function interpolateInputChangeSets(changeSet, speed) {
  let duration = changeSet.change.duration;
  let startTime = changeSet.time;
  // Break down the text into several chunks, that are spread over `duration` ms.
  // e.g if text contains 5 characters over 100 ms, we split it into 1 char over 20 ms.
  const text = changeSet.change.text.join('\n');
  const interval = 100 / (speed);
  const middle = Math.round(text.length / 2);
  let newChangeSets = [];
  if (text.length === 1 && text.replace('\n', '').length === 0) {
    return [{
      time: startTime,
      change: {
        origin: '+input',
        text: ['', ''],
        from: changeSet.change.from,
        to: changeSet.change.to
      }
    }];
  }
  for (let i = 0; i < text.length; i++) {
    // middle = 5, i = 0, len = 10
    newChangeSets.push({
      time: startTime + i * interval * (1 - 0.25 * (middle - i) / text.length),
      change: {
        origin: '+input',
        text: [text[i]],
        from: {
          line: changeSet.change.from.line,
          ch: changeSet.change.from.ch + i
        },
        to: {
          line: changeSet.change.to.line,
          ch: changeSet.change.from.ch + i + 1
        }
      }
    });
  }
  return newChangeSets;
}

function interpolateChangeSets(changeSet, speed) {
  switch (changeSet.change.origin) {
    case '+input':
      return interpolateInputChangeSets(changeSet, speed);
  }
  delete changeSet.change['duration'];
  return [changeSet];
}

export class ChangeStream extends EventEmitter {
	// *********************************************************
	// Static properties
	// *********************************************************
	static defaultOptions = {
    maxFrameDelay: 300,
    batchSize: 20,
    speed: 1
  };
	// *********************************************************
	// Constructor
	// *********************************************************
	constructor(editor, options = {}) {
		super();
		this._editor = editor;
		this._options = { ...ChangeStream.defaultOptions,
      ...options
    };
		this._isPlaying = false;
		// Array of change sets
		this._cs = [];
		// Array of snapshots created at specific intervals to speed up recompute.
		this._snapshots = [];
		// Initial editor value
		this._initialValue = '';
		// Last played frame
		this._lastFrame = null;
		// Id of rAF
		this._animId = null;
	}

	// *********************************************************
	// Public methods
	// *********************************************************
	/**
	 * Play change stream records
	 * 
	 * @returns {Number} The frame (timestamp) that we are resuming at
	 */
	play() {
    this._isPlaying = true;
    if (this._lastFrame === null && this._cs.length) {
    	this._lastFrame = this._cs[0].time;
    }
    this.resume(this._lastFrame);
    this.emit('playing', this._lastFrame);
    return this._lastFrame;
  }

  /**
   * Pause the stream
   */
  pause() {
    this._isPlaying = false;
    this._cancelChangeSetApplications();
    this.emit('paused', this._lastFrame);
  }

  /**
   * Reset stream to a specific timestamp
   * @param  {Number} timestamp The timestamp to reset stream to
   * @return {Number}           Index of the first frame that falls after timestamp
   */
  reset(timestamp) {
  	this.pause();
    let index = 0;
    // If we start at `index`. Immediately apply state until that point from `current point`.
    // We start with previous initialState, run a rapid run-through `until index`.
    for (let i = 0; i < this._cs.length; i++) {
      let start = this._cs[i].time;
      let end = (this._cs[i].change.duration || 0) + start + 1;
      if (start >= timestamp && timestamp < end) {
        index = i;
        break;
      }
    }
    // Look for a snapshot, and if we find one, use that.
    let estimatedProgress = this._calculateProgress(this._cs[index].time);
    let snapshotIndex = Math.floor(estimatedProgress * 10);
    let snapshot = this._snapshots[snapshotIndex];
    while (!snapshot && snapshotIndex > 0) {
      snapshot = this._snapshots[snapshotIndex];
      snapshotIndex--;
    }
    // We use a sync-reset for now. TODO: Tharun add a async method here and use cb or events or worker
    // to notify that stream is busy resetting..
    if (snapshot) {
      this._editor.setValue(snapshot.v);
      // The last frame is the time point at which snapshot resides
      this._cs.slice(snapshot.i + 1, index).forEach((ch) => {
        this._editor.applyChange(ch);
      });
    } else {
      this._editor.setValue(this._initialValue);
      this._cs.slice(0, index).forEach((ch) => {
        this._editor.applyChange(ch);
      });
    }
    this._lastFrame = this._cs[index].time;
    return index;
  }

  /**
   * Resume the stream from a given timestamp
   * @param  {Number} timestamp The timestamp to resume from, optional
   */
  resume(timestamp) {
    let index = this.reset(timestamp || this._lastFrame);
    this._isPlaying = true;
    this.emit('playing', timestamp);
    this._applyBatchedChangesWithRAF(this._cs.slice(index, this._cs.length));
  }


  /**
   * Apply a series of change sets
   * @param  {String} initialValue  The initial editor string value
   * @param  {Array} changeSets     Array of change sets
   */
  apply(initialValue, changeSets = []) {
  	this._initialValue = initialValue;
  	this._snapshots = [];
  	this._cs = changeSets;
  }

  /**
   * Set speed of playback
   */
  setSpeed(speed) {
  	if (this._isPlaying) {
  		this.pause();
  	}
  	this._options.speed = speed;
  }

  // *********************************************************
  // Private methods
  // *********************************************************
  /**
   * Cancel any pending RAF change set applications
   */
  _cancelChangeSetApplications() {
  	if (this._animId !== null) {
  		cancelAnimationFrame(this._animId);
  	}
  }

  /**
   * Apply a series of changes in batches using requestAnimationFrame
   * @param  {Array} changeSets     Array of change sets
   * @param  {Boolean} useDelay     Boolean indicating if we should be applying delay
   */
  async _applyBatchedChangesWithRAF(changeSets, useDelay = true) {
  	const {
      batchSize,
      maxFrameDelay,
      speed
    } = this._options;
    // If this function is called when we are in playing state, ignore
    if (!this._isPlaying) {
      return;
    }
    
    // Get slice and run each change object
    let slice = changeSets.slice(0, batchSize);
    await asyncForEach(slice, async(changeSet, i) => {
    	// We need a second guard here because the function is async.
      if (!this._isPlaying) {
        return;
      }
      let ch = changeSet.change;
      let indent = ch.text ? (ch.text.indexOf(' ') > -1) : false;

      if (ch.duration !== undefined) {
        // This means we have to interpolate. We will run await on new interpolated changeSets
        let interpolatedChs = interpolateChangeSets(changeSet, speed);
        // Interpolation will change progress computation.
        return await this._applyBatchedChangesWithRAF(interpolatedChs);
      } else {
        this._editor.applyChange(changeSet);
      }
      // If we have an indent operation, we make it feel "instant".
      let timeDelay;
      if (slice[i + 1]) {
        timeDelay = indent ? 0 : (Math.min(slice[i + 1].time - slice[i].time - (ch.duration || 0), maxFrameDelay) / speed);
      } else {
        timeDelay = 0;
      }
      // Emit event that allows handle controls to schedule it's own animation
      const progress = this._calculateProgress();
      // Record snapshots so that we can re-start from a snapshot point.
      if (Math.floor(progress * 10) === this._snapshots.length) {
      	// this._snapshots[Math.floor(progress * 10)] = {
        //   i,
        //   v: this._editor.getValue()
        // };
      }
      // Emit the progress
      this._emitProgress(progress, timeDelay);
      // Delay to simulate `typing`
      await delay(timeDelay);
      // Reset lastFrame
      this._lastFrame = slice[i].time;
    });

    // Take remaining and recurse
    changeSets = changeSets.slice(batchSize, changeSets.length);

   	// If no more remain, we break
    if (changeSets.length > 0) {
      await this._applyBatchedChangesWithRAF(changeSets);
    } else {
      this._emitProgress(1, 0);
      this.emit('done');
    }
  }

  _calculateProgress(time) {
    let p = time || this._lastFrame;
    let last = this._cs[this._cs.length - 1];
  	let end = last.time + (last.change.duration || 0);
    let t0 = this._cs[0].time;
    return (p - t0) / (end - t0);
  }

  /**
   * Emit the progress of the stream so that handles can update
   * @param  {Number} progress   Progress (0 - 1)
   * @param  {Number} delay      Delay in milliseconds
   */
  _emitProgress(progress, delay) {
    if (!this._isPlaying) {
      return;
    }
    if (!this._cs.length) {
    	return;
    }
    // Schedule control bar updates
    this.emit('progress', progress, delay);
  }
}