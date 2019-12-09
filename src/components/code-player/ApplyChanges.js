/**
 * Insert given text inside codemirror editor
 * @param  {CodeMirror} editor         Codemirror editor
 * @param  {CodeMirror.Range} range    The range this change refers to
 * @param  {String} text               The text to insert
 */
function insertTextAtCursor(editor, range, text) {
  let doc = editor.getDoc();
  doc.replaceRange(text, range.from, range.to);
}

/**
 * Delete characters for a given range
 * @param  {CodeMirror} editor         Codemirror editor
 * @param  {CodeMirror.Range} range    The range this change refers to
 */
function deleteCharacters(editor, range) {
	let doc = editor.getDoc();
  doc.replaceRange("", range.from, range.to);
}

/**
 * Add a new selection to codemirror editor
 * @param  {CodeMirror} editor         Codemirror editor
 * @param  {CodeMirror.Range} range    The range this change refers to
 */
function selectText(editor, selection) {
	let doc = editor.getDoc();
	doc.setSelection(selection.range.anchor, selection.range.head);
}

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
 * Apply a series of Codemirror changes in batches using requestAnimationFrame
 * @param  {CodeMirror} cm        Codemirror editor
 * @param  {Array} changeSets     Array of change sets
 * @param  {Number} batchSize     Size of a batch
 * @param  {Function} callback    Optional callback that is fired when changes are done
 * @param  {Number} maxFrameDelay The maximum delay before next frame is called.
 */
export async function applyBatchedChangesWithRAF(cm, changeSets, batchSize, callback, maxFrameDelay = 300) {
  // run each after a delay
  var slice = changeSets.slice(0, batchSize);
  await asyncForEach(slice, async (obj, i) => {
    let ch = obj.change;
		let indent = ch.text ? (ch.text.join('\n').indexOf(' ') > -1) : false;
  	switch (ch.origin) {
    	case "+input":
      case "paste":
      	insertTextAtCursor(cm, ch, ch.text.join("\n"))
      	break;
      case "+delete":
      	deleteCharacters(cm, ch);
        break;
      case "+select":
      	selectText(cm, ch);
        break;
      case "+setValue":
        break;
      default:
      	console.warn('unhandled', obj);
				break;
    }
    if (!indent) {
      if (slice[i].delay !== undefined) {
        await delay(Math.min(slice[i].delay, maxFrameDelay));
      } else if (slice[i + 1]) {
        await delay(Math.min(slice[i + 1].time - slice[i].time, maxFrameDelay));  
      }
    }
  });
	changeSets = changeSets.slice(batchSize, changeSets.length);
  if (changeSets.length > 0) {
    requestAnimationFrame(async function() {
      await applyBatchedChangesWithRAF(cm, changeSets, batchSize, callback, maxFrameDelay);
    });
  } else {
    if (callback) {
      callback();
    }
  }
}