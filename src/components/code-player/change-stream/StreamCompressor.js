/**
 * Compress a change stream according to the provided compression ratio. Compression ratio
 * varies from 0 (No compression) to 3 (Heavy compression). The default compression level
 * is 1.
 * 
 * Given below are the details of the compression technique
 * 
 * Level 0: NA
 * 
 * Level 1:
 * Merge adjacent operations with same `origin`. e.g insertCharacter('a), followed by insertCharacter('b)
 * becomes insertCharacter('ab') over duration (t_b - t_a). The duration will be interpolated by the player
 * during playback, where it will simply break down the operation linearly over the duration.
 * 
 * Level 2:
 * In addition to level one, detect and swallow "typos". e.g insertCharacter('a'), insertCharacter('b) deleteCharacter('a')
 * becomes insertCharacter('b'). This step uses a reasonable lookaround window of 5.
 * 
 * Level 3:
 * In addition to Level 3, remove selection operations, and cross word boundaries.
 * words.
 * 
 * @param {Array} changeSets  Array of change sets 
 * @param {Number} compressionLevel  Level of compression 
 */
export function compressStream(changeSets, compressionLevel = 1) {
    switch (compressionLevel) {
        case 0:
            return changeSets;
        case 1:
        case 2:
        case 3:
            changeSets = compressionLevel === 2 ? combineInsertsAndDeletes(changeSets) : changeSets;
            changeSets = mergeAdjacentOps(changeSets, compressionLevel > 1);
            changeSets = compressionLevel === 3 ? changeSets.filter((ch) => ch.change && ch.change.origin !== '+select') : changeSets;
            // changeSets = compressionLevel === 3 ? combineLargeOpsAndUseWordSets(changeSets) : changeSets;
            return changeSets;
        default:
            return changeSets;
    }
};

function safeEqualityCompare(obj1, obj2, keyPath) {
    const len = keyPath.length;
    for (let i = 0; i < len; i++) {
        const key = keyPath[i];
        if (obj1 !== undefined && obj2 !== undefined && obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key)) {
            obj1 = obj1[key];
            obj2 = obj2[key];
        } else {
            return false;
        }
    }
    return obj1 === obj2;
}

function *SameOpGenerator(changeSets, crossWordBoundaries) {
    let i = 1;
    let len = changeSets.length;
    let same = [changeSets[0]];
    while (i < len) {
        if (safeEqualityCompare(changeSets[i], changeSets[i - 1], ['change', 'origin'])) {
            if (crossWordBoundaries) {
                same.push(changeSets[i]);
            } else {
                // Check if changeset invoves a space or tab or newline
                if (!/\s|\t|\n/ig.test(changeSets[i].change.text.join(''))) {
                    same.push(changeSets[i]);
                } else {
                    yield same;
                    same = [changeSets[i]];
                }
            }
        } else {
            yield same;
            same = [changeSets[i]];
        }
        i++;
    }
    yield same;
}

function *SameLineGenerator(changeSets) {
    let i = 1;
    let len = changeSets.length;
    if (len < 2) {
        yield changeSets;
        return;
    }
    let same = [changeSets[0]];
    while (i < len) {
        // Ducktype using `.change`
        // For input + delete operations, line is present on `change.from` key
        // For select, operations, we have to check if anchor is same, and head is on same line
        // or if head is same, and anchor is on same line
        if (safeEqualityCompare(changeSets[i - 1], changeSets[i], ['change', 'from' , 'line'])) {
            same.push(changeSets[i]);
        } else if (safeEqualityCompare(changeSets[i - 1], changeSets[i], ['change', 'range' , 'head', 'line']) || safeEqualityCompare(changeSets[i - 1], changeSets[i], ['change', 'range' , 'anchor', 'line'])) {
            // Head or anchor is the same, this means we can merge `select` and other operations that rely on range
            same.push(changeSets[i]);
        } else {
            yield same;
            same = [changeSets[i]];
        }
        i++;
    }
    yield same;
}

function isAdjacentSelect(obj1, obj2) {
    // Case 1, same head, different anchor
    // Case 2, same anchor, different head
    if (safeEqualityCompare(obj1, obj2, ['change', 'range', 'head', 'line']) && safeEqualityCompare(obj1, obj2, ['change', 'range', 'head', 'ch'])) {
        return true;
    } else if (safeEqualityCompare(obj1, obj2, ['change', 'range', 'anchor', 'line']) && safeEqualityCompare(obj1, obj2, ['change', 'range', 'anchor', 'ch'])) {
        return true;
    }
    return false;
}

function *AdjacentRangeGenerator(changeSets) {
    if (changeSets.length < 2) {
        yield changeSets;
        return;
    }
    let same = [changeSets[0]];
    for (let i = 1; i < changeSets.length; i++) {
        // For adjacent, we check if `to` of first  = `from` - 1
        if (changeSets[i].change.origin === '+input' && Math.abs(changeSets[i].change.from.ch - changeSets[i - 1].change.to.ch) === 1) {
            same.push(changeSets[i]);
        } else if (changeSets[i].change.origin === '+delete' && Math.abs(changeSets[i].change.from.ch - changeSets[i - 1].change.from.ch) === 1) {
            same.push(changeSets[i]);
        } else if (changeSets[i].change.origin === '+select' && isAdjacentSelect(changeSets[i - 1], changeSets[i])) {
            same.push(changeSets[i]);
        } else {
            yield same;
            same = [changeSets[i]];
        }
    }
    yield same;
}

/**
 * Combine adjacent change sets for input op
 * @param {Array} adjacentChangeSets
 */
function combineInputOps(adjacentChangeSets) {
    const adjsLen = adjacentChangeSets.length - 1;
    return {
        ...adjacentChangeSets[0],
        change: {
            origin: '+input',
            duration: adjacentChangeSets[adjsLen].time - adjacentChangeSets[0].time,
            text: [adjacentChangeSets.map((a) => a.change.text.join('\n')).join('')],
            from: {
                line: adjacentChangeSets[0].change.from.line,
                ch: adjacentChangeSets[0].change.from.ch
            },
            to: {
                line: adjacentChangeSets[adjsLen].change.from.line,
                ch: adjacentChangeSets[adjsLen].change.to.ch
            }
        }
    };
}

/**
 * Combine adjacent change sets for delete op
 * @param {Array} adjacentChangeSets
 */
function combineDeleteOps(adjacentChangeSets) {
    const adjsLen = adjacentChangeSets.length - 1;
    return {
        ...adjacentChangeSets[0],
        change: {
            origin: '+delete',
            to: {
                line: adjacentChangeSets[0].change.to.line,
                ch: adjacentChangeSets[0].change.to.ch,
                sticky: adjacentChangeSets[0].change.to.sticky
            },
            from: {
                line: adjacentChangeSets[adjsLen].change.from.line,
                ch: adjacentChangeSets[adjsLen].change.from.ch,
                sticky: adjacentChangeSets[adjsLen].change.from.sticky
            }
        }
    };
}

/**
 * Combine selections with same anchor or head
 * 
 * @param {Array} adjacentChangeSets
 */
function combineSelectOps(adjacentChangeSets) {
    const adjsLen = adjacentChangeSets.length - 1;
    return {
        ...adjacentChangeSets[0],
        change: {
            origin: '+select',
            range: {
                head: {
                    line: adjacentChangeSets[adjsLen].change.range.head.line,
                    ch: adjacentChangeSets[adjsLen].change.range.head.ch
                },
                anchor: {
                    line: adjacentChangeSets[0].change.range.anchor.line,
                    ch: adjacentChangeSets[0].change.range.anchor.ch
                }
            }
        }
    };
}

/**
 * Merge adjacent operations according to the cursor position
 * @param {Array} changeSets            Array of initial changesets
 * @param {Boolean} crossWordBoundaries Whether we should cross word boundaries (spaces, tabs while compressing)
 * @returns {Array}                     Array of compressed changesets
 */
function mergeAdjacentOps(changeSets, crossWordBoundaries = false) {
    if (changeSets.length < 2) {
        return changeSets;
    } else {
        let compressedChangeSets = [];
        for (let chs of SameOpGenerator(changeSets, crossWordBoundaries)) {
            for (let sameLines of SameLineGenerator(chs)) {
                if (sameLines.length < 2) {
                    compressedChangeSets = compressedChangeSets.concat(sameLines);
                } else {
                    for (let adjs of AdjacentRangeGenerator(sameLines)) {
                        let op = adjs[0].change.origin;
                        if (op === '+input') {
                            compressedChangeSets.push(combineInputOps(adjs));
                        } else if (op === '+delete') {
                            compressedChangeSets.push(combineDeleteOps(adjs));
                        } else if (op === '+select') {
                            compressedChangeSets.push(combineSelectOps(adjs));
                        }
                    }
                }
            }
        }
        return compressedChangeSets;
    }
}

/**
 * If an input operation is followed by a delete operation, then we adjust the input operation
 * so that the delete is swallowed.
 * 
 * e.g  "fo" > add "o" results in "foo"
 * now if we delete the last o, we get "fo" again
 * if next input is "obar", then we have a single input "foobar"
 * 
 * 
 * Thus this compression level can swallow typos. We cross word boundaries iff level is 3.
 * 
 * @param {Array} changeSets 
 */
function combineInsertsAndDeletes(changeSets) {
    // Get all ops on the same line, write into memory, and perform operations in *memory*.
    // Then we write back as input elements, based on word boundaries
    let removed = [];
    const len = changeSets.length;
    let found;
    for (let i = 1; i < len; i++) {
        if (changeSets[i].change.origin === '+delete' && changeSets[i - 1].change.origin === '+input') {
            found = i;
            break;
        }
    }
    if (found !== undefined) {
        // delete, followed by input.
        // Check if input completely `swallows` delete
        let start = found - 1;
        let end = found;
        let deleteRange = changeSets[end].change;
        let inputRange = changeSets[start].change;
        // Now look back -1 && +1, and see if same criteria is met
        while (start >= 0 && end < len && deleteRange.from.line === inputRange.from.line && deleteRange.from.ch === inputRange.from.ch && (deleteRange.to.ch - 1) === inputRange.to.ch) {
            removed = removed.concat([start, end]);
            start -= 1;
            end -= 1;
            deleteRange = changeSets[end] && changeSets[end].change;
            inputRange = changeSets[start] && changeSets[start].change;
        }
        changeSets = changeSets.filter((d, i) => removed.indexOf(i) === -1);
        if (removed.length > 1) {
            changeSets = combineInsertsAndDeletes(changeSets);
        }
    }
    return changeSets;
}