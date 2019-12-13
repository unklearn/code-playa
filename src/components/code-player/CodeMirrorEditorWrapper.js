export default class CodeMirrorEditorWrapper {
	constructor(cm) {
		this._cm = cm;
	}

	setValue(value) {
		this._cm.setValue(value);
	}

	getValue() {
		return this._cm.getValue();
	}

	applyChange(changeSet) {
		const cm = this._cm;
    let ch = changeSet.change;
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
        console.warn('unhandled', changeSet);
        break;
    }
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
    let doc = this._cm.getDoc();
    doc.replaceRange(text, range.from, range.to);
  }

  /**
   * Delete characters for a given range
   * @param  {CodeMirror} editor         Codemirror editor
   * @param  {CodeMirror.Range} range    The range this change refers to
   */
  _deleteCharacters(editor, range) {
    let doc = this._cm.getDoc();
    doc.replaceRange("", range.from, range.to);
  }

  /**
   * Add a new selection to codemirror editor
   * @param  {CodeMirror} editor         Codemirror editor
   * @param  {CodeMirror.Range} range    The range this change refers to
   */
  _selectText(editor, selection) {
    let doc = this._cm.getDoc();
    doc.setSelection(selection.range.anchor, selection.range.head);
  }
}