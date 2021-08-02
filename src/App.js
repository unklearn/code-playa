import React from 'react';
import './App.css';
import Sidebar from './components/sidebar/index.js';
import { CodeMirrorPlayer } from './components/code-player';

let iframe = false;
if (window.top!=window.self)
{
  // In a Frame or IFrame
  iframe = true;
}
else
{
  // Not in a frame
  iframe = false;
} 

// Context subscribers will then re-render.
// Player component holds top-level context.
function App() {
  return (
    <div className='App'>
      {!iframe && <header className='App-header'>
        Codeplaya
      </header>}
      {!iframe && <Sidebar>
          <h4>About</h4>
          <p>
            Codeplaya is a code playback player inspired by the likes of <a href='https://asciinema.org/' target='_blank'>asciinema.</a>
          </p>
          <p>
            The project source is located <a href='https://github.com/unklearn/code-playa' target='_blank'>here</a>
          </p>
          <blockquote style={{"color": "red"}}>
            Warning! Alpha state software. This is more of a hackathon than a complete project. APIs may change without
            notice
          </blockquote>
          <p>
            &copy; <a href='https://github.com/tmpaul' target='_blank'>TMP</a>
          </p>
      </Sidebar>}
      <main style={{
        margin: iframe ? '0px': undefined,
        padding: iframe ? '0px' : '25px'
      }}>
        <CodeMirrorPlayer editing/>
        <p>Click the yellow button to start recording. Then start typing code in the editor (default language is golang). Once you're finished, press the red square button to stop recording.</p>
      </main>
    </div>
  );
}

export default App;
