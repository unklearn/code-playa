import React from 'react';
import './App.css';
import Sidebar from './components/sidebar/index.js';
import { CodeMirrorPlayer } from './components/code-player';



// Context subscribers will then re-render.
// Player component holds top-level context.
function App() {
  return (
    <div className='App'>
      <header className='App-header'>

      </header>
      <Sidebar>
      </Sidebar>
      <main>
        <CodeMirrorPlayer editing/>
        <p>Click the logo to begin</p>
      </main>
    </div>
  );
}

export default App;
