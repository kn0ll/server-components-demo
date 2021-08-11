/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Suspense} from 'react';

import Note from './Note.server';
import NoteList from './NoteList.server';
import EditButton from './EditButton.client';
import SearchField from './SearchField.client';
import NoteSkeleton from './NoteSkeleton';
import NoteListSkeleton from './NoteListSkeleton';

/*
so the goal is to get <App /> to render a second time, and send the updates to the client.

first attempt was to use state and effects, like:

```
export default function App({selectedId, isEditing, searchText}) {
  const [state, setState] = useState(0)
  useEffect(() => {
    setInterval(() => {
      setState(Math.random())
    }, 1000)
  }, [])

  return el
}
```

but the issue is that useEffect and useState are not defined on whatever React we are loading. so, scratch this plan all together.
*/

/*
we inspect React to see what's available. the only relevant things are `unstable_createMutableSource` and `unstable_useMutableSource`,
so we try that next.

```
const GameState = () => {
  const state = {
    player1: [0, 0],
    player2: [0, 0]
  }
  
  const emitter = new EventEmitter();

  return { state, emitter };
}

const gameState = GameState();

const updateState = (playerId, index, value) => {
  gameState.state[playerId][index] = value;
  gameState.emitter.emit("changed");
}

const gameStateSource = unstable_createMutableSource(
  gameState,
  () => gameState.state
);

const getSnapshot = gameState => JSON.stringify(gameState.state);

const subscribe = (gameState, callback) => {
  gameState.emitter.addEventListener("changed", callback);
  return () => gameState.emitter.removeEventListener("changed", callback);
};

export default function App({selectedId, isEditing, searchText}) {
  const state = unstable_useMutableSource(gameStateSource, getSnapshot, subscribe);

  return el
}
```

These functions are actually available this time, but we get an error like "This hook is not supported in server components."
*/

/*
Now we are at a loss, so we try to see if server-components supports anything weird we haven't considered, like the ability to control rendering through a promise:

```
export default function App({selectedId, isEditing, searchText}) {
  const state = unstable_useMutableSource(gameStateSource, getSnapshot, subscribe);

  return new Promise((resolve) => resolve(el))
}

But this fails because, obviously React doesn't support rendering of Promises.
```
*/

export default function App({selectedId, isEditing, searchText}) {
  return (
    <div className="main">
      <section className="col sidebar">
        <section className="sidebar-header">
          <img
            className="logo"
            src="logo.svg"
            width="22px"
            height="20px"
            alt=""
            role="presentation"
          />
          <strong>React Notes</strong>
        </section>
        <section className="sidebar-menu" role="menubar">
          <SearchField />
          <EditButton noteId={null}>New</EditButton>
        </section>
        <nav>
          <Suspense fallback={<NoteListSkeleton />}>
            <NoteList searchText={searchText} />
          </Suspense>
        </nav>
      </section>
      <section key={selectedId} className="col note-viewer">
        <Suspense fallback={<NoteSkeleton isEditing={isEditing} />}>
          <Note selectedId={selectedId} isEditing={isEditing} />
        </Suspense>
      </section>
    </div>
  );
}
