// *********************************************************
// Utility methods
// *********************************************************

/**
 * Delay an async task by given time in ms
 * @param  {Number} time Milliseconds to delay the task by
 */
export function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

/**
 * An async version of forEach. Waits for each callback to execute before
 * moving on
 * @param  {Array}   array     The array to process via async forEach
 * @param  {Function} callback The callback function to call
 */
export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}