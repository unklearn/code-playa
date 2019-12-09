/**
 * Run the provided function when a particular keycode is pressed. For all other keycodes,
 * it is ignored
 * @param  {Number} keyCode Numeric keycode constant
 * @param  {Function} func  Callback function to call with keyup event
 * @return {Function}       Filter to run when keyCode is pressed
 */
export function runWhenKeyPressed(keyCode, func) {
	return function(e) {
		if (e.keyCode === keyCode) {
			return func(e);
		}
	};
};