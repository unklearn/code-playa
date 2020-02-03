export default class CodeMirrorEditorWrapper {
	constructor(cm, addChangeCb) {
    this._cm = cm;
    this._addChangeCb = addChangeCb;
    this._addListeners();
    this._frozen = false;
    window.doc = cm;
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
        this._insertTextAtCursor(cm, ch, ch.text.join("\n"))
        break;
      case "paste":
        this._insertTextAtCursor(cm, {
          from: ch.from
        }, ch.text.join("\n"))
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

  freeze() {
    this._frozen = true;
    this._cm.setOption('readOnly', true);
  }

  unfreeze() {
    this._frozen = false;
    this._cm.setOption('readOnly', false);
  }
  
  // *********************************************************
  // Private methods
  // *********************************************************
  _addListeners() {
    let cm = this._cm;
    // Setup event listeners and record changesets
    cm.on("beforeSelectionChange", (editor, selection) => {
      if (this._frozen) {
        return;
      }
      // Get first range from selection
      let range = selection.ranges[0];
      if (!range || !range.anchor || !range.head) {
        return;
      }
      if (range.anchor.line === range.head.line && range.anchor.ch === range.head.ch) {
        return;
      }
      this._addChangeCb({
        origin: "+select",
        range: range
      });
    });

    // Store series of changes
    cm.on("changes", (cm, changes) => {
      if (this._frozen) {
        return;
      }
      changes.forEach((change) => {
        this._addChangeCb(change);
      });
    });
  }
  
  /**
   * Insert given text inside codemirror editor
   * @param  {CodeMirror} editor         Codemirror editor
   * @param  {CodeMirror.Range} range    The range this change refers to
   * @param  {String} text               The text to insert
   */
  _insertTextAtCursor(editor, range, text) {
    let doc = this._cm.getDoc();
    this._cm.scrollIntoView(range.from);
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