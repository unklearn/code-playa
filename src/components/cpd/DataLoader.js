const SEPARATOR = '\n';

/**
 * A class that writes a recording to file along with options
 */
export default class CPDWriter {
    static write(recording, options) {
        // We cannot use newline as separator because recording steps may contain `newline`.
        // So we use special separator
        let { mode, directory } = options;
        let lines = [`mode=${directory}:${mode}`, `speed=${options.speed}`, `data=${btoa(JSON.stringify(recording))}`];
        return lines.join(SEPARATOR);
    }

    static parse(fileContent) {
        let lines = fileContent.split(SEPARATOR);
        let options = {};
        let recording = [];
        lines.forEach((line) => {
            if (line.indexOf('speed') > -1) {
                let speed = Number(line.split('=')[1]);
                options.speed = speed;
            } else if (line.indexOf('mode') > -1) {
                let string = line.split('=')[1];
                let parts = string.split(':');
                options.mode = parts[1];
                options.directory = parts[0];
            } else if (line.indexOf('data') > -1) {
                let data = line.slice(5);
                try {
                    recording = JSON.parse(atob(data));
                } catch (e) {
                    // pass
                    console.error(e, data);
                }
            }
        });
        return {
            options,
            recording
        };
    }
}