import React from 'react';
import './App.css';
import Sidebar from 'components/sidebar/index.js';
import { ChapterGroup, NewChapterGroup} from 'components/chapter-group';
import { ChapterPlayer } from 'components/player';
import { CodeMirrorPlayer } from 'components/code-player';



// Context subscribers will then re-render.
// Player component holds top-level context.
function App() {
  return (
    <div className='App'>
      <header className='App-header'>

      </header>
      <Sidebar>
        <ChapterGroup
          title={'Introduction'}
          chapters={[{
            id: 'chapter-1',
            label: 'Setting up'
          }, {
            id: 'chapter-2',
            label: 'Installation instructions'
          }]}
        />
        <NewChapterGroup/>
      </Sidebar>
      <main>
        <CodeMirrorPlayer editing/>
      </main>
    </div>
  );
}

export default App;
