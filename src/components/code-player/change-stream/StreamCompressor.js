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
 * In addition to Level 3, combine selection + delete into simply delete operations. Merge character sets into entire
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
            changeSets = mergeAdjacentOps(changeSets);
            // changeSets = compressionLevel === 2 ? combineInsertsAndDeletes(changeSets) : changeSets;
            // changeSets = compressionLevel === 3 ? combineLargeOpsAndUseWordSets(changeSets) : changeSets;
            return changeSets;
        default:
            return changeSets;
    }
};

function *SameOpGenerator(changeSets) {
    let i = 1;
    let len = changeSets.length;
    let same = [changeSets[0]];
    while (i < len) {
        if (changeSets[i].change && changeSets[i - 1].change && changeSets[i].change.origin === changeSets[i - 1].change.origin) {
            same.push(changeSets[i]);
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
    }
    let same = [changeSets[0]];
    while (i < len) {
        // Ducktype using `.change`
        if (changeSets[i - 1].change && changeSets[i].change && changeSets[i - 1].change.from && changeSets[i].change.from && changeSets[i - 1].change.from.line === changeSets[i].change.from.line) {
            same.push(changeSets[i]);
        } else {
            yield same;
            same = [changeSets[i]];
        }
        i++;
    }
    yield same;
}

function *AdjacentRangeGenerator(changeSets) {
    if (changeSets.length < 2) {
        return changeSets;
    }
    let same = [changeSets[0]];
    for (let i = 1; i < changeSets.length; i++) {
        // For adjacent, we check if `to` of first  = `from` - 1
        if (changeSets[i].change.origin === '+input' && Math.abs(changeSets[i].change.from.ch - changeSets[i - 1].change.to.ch) === 1) {
            same.push(changeSets[i]);
        } else if (changeSets[i].change.origin === '+delete' && Math.abs(changeSets[i].change.from.ch - changeSets[i - 1].change.from.ch) === 1) {
            same.push(changeSets[i]);
        } else {
            yield same;
            same = [changeSets[i]];
        }
    }
    yield same;
}

/**
 * Merge adjacent operations according to the cursor position
 * @param {Array} changeSets Array of initial changesets 
 * @returns {Array} Array of compressed changesets
 */
function mergeAdjacentOps(changeSets) {
    if (changeSets.length < 2) {
        return changeSets;
    } else {
        let compressedChangeSets = [];
        for (let chs of SameOpGenerator(changeSets)) {
            for (let sameLines of SameLineGenerator(chs)) {
                if (sameLines.length < 2) {
                    compressedChangeSets = compressedChangeSets.concat(sameLines);
                } else {
                    for (let adjs of AdjacentRangeGenerator(sameLines)) {
                        let op = adjs[0].change.origin;
                        let adjsLen = adjs.length - 1;
                        if (op === '+input') {
                            compressedChangeSets.push({
                                ...adjs[0],
                                change: {
                                    origin: '+input',
                                    text: [adjs.map((a) => a.change.text.join('')).join('')],
                                    from: {
                                        line: adjs[0].change.from.line,
                                        ch: adjs[0].change.from.ch
                                    },
                                    to: {
                                        line: adjs[adjsLen].change.from.line,
                                        ch: adjs[adjsLen].change.to.ch
                                    }
                                }
                            });
                        } else if (op === '+delete') {
                            compressedChangeSets.push({
                                ...adjs[0],
                                change: {
                                    origin: '+delete',
                                    to: {
                                        line: adjs[0].change.to.line,
                                        ch: adjs[0].change.to.ch
                                    },
                                    from: {
                                        line: adjs[adjsLen].change.from.line,
                                        ch: adjs[adjsLen].change.from.ch
                                    }
                                }
                            });
                        } else {
                            console.log(adjs);
                        }
                    }
                }
            }
        }
        return compressedChangeSets;
    }
}