// *********************************************************
// Utility methods
// *********************************************************

/**
 * Delay an async task by given time in ms
 * @param  {Number} time Milliseconds to delay the task by
 */
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

/**
 * An async version of forEach. Waits for each callback to execute before
 * moving on
 * @param  {Array}   array     The array to process via async forEach
 * @param  {Function} callback The callback function to call
 */
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}


/**
 * A stream of change records that can be played
 */
export class ChangeRecordStream {
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
    this.editor = editor;
    this.options = { ...ChangeRecordStream.defaultOptions,
      ...options
    };
    this.animId = null;
    this.playing = false;
    this.lastCoveredTimeStamp = null;
    this.changeSets = [];
    this.eventRegistry = {};
  }

  // *********************************************************
  // Public methods
  // *********************************************************
  /**
   * Play the stream
   */
  play() {
    this.playing = true;
    this.resume(this.lastCoveredTimeStamp);
  }

  /**
   * Pause the stream
   */
  pause() {
    this.playing = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    this.editor.setOption('readOnly', false);
  }

  reset(timestamp) {
    let index = 0;
    // If we start at `index`. Immediately apply state until that point from `current point`.
    // We start with previous initialState, run a rapid run-through `until index`.
    this.editor.setValue(this.options.initialValue);
    for (let i = 0; i < this.changeSets.length; i++) {
      this._applySingleChange(this.changeSets[i]);
      if (this.changeSets[i].time >= timestamp) {
        index = i;
        break;
      }
    }
    this.lastCoveredTimeStamp = timestamp;
    return index;
  }

  /**
   * Resume the stream from a given timestamp
   * @param  {Number} timestamp The timestamp to resume from
   */
  resume(timestamp) {
    this.pause();
    this.editor.setOption('readOnly', true);
    this.playing = true;
    let index = this.reset(timestamp);
    this._applyBatchedChangesWithRAF(this.changeSets.slice(index + 1, this.changeSets.length));
  }


  /**
   * Apply a series of change sets
   * @param  {Array} changeSets     Array of change sets
   */
  apply(changeSets) {
    this.changeSets = changeSets;
    if (this.changeSets.length) {
      this.lastCoveredTimeStamp = this.changeSets[0].time;
    }
  }

  on(event, listener) {
    this.eventRegistry[event] = this.eventRegistry[event] || [];
    this.eventRegistry[event].push(listener);
    return this.eventRegistry[event].length - 1;
  }

  off(event, listenerId) {
    delete this.eventRegistry[listenerId];
  }

  // *********************************************************
  // Private methods
  // *********************************************************
  /**
   * Insert given text inside codemirror editor
   * @param  {CodeMirror} editor         Codemirror editor
   * @param  {CodeMirror.Range} range    The range this change refers to
   * @param  {String} text               The text to insert
   */
  _insertTextAtCursor(editor, range, text) {
    let doc = this.editor.getDoc();
    doc.replaceRange(text, range.from, range.to);
  }

  /**
   * Delete characters for a given range
   * @param  {CodeMirror} editor         Codemirror editor
   * @param  {CodeMirror.Range} range    The range this change refers to
   */
  _deleteCharacters(editor, range) {
    let doc = this.editor.getDoc();
    doc.replaceRange("", range.from, range.to);
  }

  /**
   * Add a new selection to codemirror editor
   * @param  {CodeMirror} editor         Codemirror editor
   * @param  {CodeMirror.Range} range    The range this change refers to
   */
  _selectText(editor, selection) {
    let doc = this.editor.getDoc();
    doc.setSelection(selection.range.anchor, selection.range.head);
  }

  /**
   * Apply a series of Codemirror changes in batches using requestAnimationFrame
   * @param  {Array} changeSets     Array of change sets
   */
  async _applyBatchedChangesWithRAF(changeSets) {
    if (this.animId === null) {
      this.animId = requestAnimationFrame(async () => {
        await this._applyBatchedChangesWithRAF(changeSets);
      });
      return;
    }
    const cm = this.editor;
    if (!this.playing) {
      return;
    }
    const {
      batchSize,
      callback,
      maxFrameDelay,
      speed
    } = this.options;
    // run each after a delay
    let slice = changeSets.slice(0, batchSize);
    await asyncForEach(slice, async(obj, i) => {
      if (!this.playing) {
        return;
      }
      let ch = obj.change;
      let indent = ch.text ? (ch.text.join('\n').indexOf(' ') > -1) : false;
      this._applySingleChange(obj);
      if (!indent) {
        if (slice[i].delay !== undefined) {
          await delay(Math.min(slice[i].delay, maxFrameDelay) / speed);
        } else if (slice[i + 1]) {
          await delay(Math.min(slice[i + 1].time - slice[i].time, maxFrameDelay) / speed);
        }
      }
      this.lastCoveredTimeStamp = slice[i].time;
      this._emitProgress();
    });
    changeSets = changeSets.slice(batchSize, changeSets.length);
    if (changeSets.length > 0) {
      this.animId = requestAnimationFrame(async () => {
        await this._applyBatchedChangesWithRAF(changeSets);
      });
    } else {
      this.lastCoveredTimeStamp = this.changeSets[this.changeSets.length - 1].time;
      this._emitProgress();
      cm.setOption('readOnly', false);
      if (callback) {
        callback();
      }
    }
  }

  _applySingleChange(obj) {
    if (!this.playing) {
      return;
    }
    const cm = this.editor;
    let ch = obj.change;
    switch (ch.origin) {
      case "+input":
      case "paste":
        this._insertTextAtCursor(cm, ch, ch.text.join("\n"))
        break;
      case "+delete":
        this._deleteCharacters(cm, ch);
        break;
      case "+select":
        this._selectText(cm, ch);
        break;
      case "+setValue":
        break;
      default:
        console.warn('unhandled', obj);
        break;
    }
  }

  _emitProgress() {
    if (!this.playing) {
      return;
    }
    let p = this.lastCoveredTimeStamp;
    let end = this.changeSets[this.changeSets.length - 1].time;
    let t0 = this.changeSets[0].time;
    this.eventRegistry.progress.map((l) => l((p - t0) / (end - t0)))
  }
}