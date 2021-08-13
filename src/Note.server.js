/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {fetch} from 'react-fetch';
import {readFile} from 'react-fs';
import {format} from 'date-fns';
import path from 'path';
import fs from 'fs';

import pool from '../server/pool';
import {db} from './db.server';
import NotePreview from './NotePreview';
import EditButton from './EditButton.client';
import NoteEditor from './NoteEditor.client';

const NOTES_PATH = path.resolve(__dirname, '../notes');

export default function Note({selectedId, isEditing}) {
  let note = null;
  if (selectedId !== null) {
    note = db.query(
      `select * from notes where id = $1`,
      [selectedId]
    ).rows[0];
  }

  if (note === null) {
    if (isEditing) {
      return (
        <NoteEditor
          noteId={null}
          initialTitle="Untitled"
          initialBody=""
          saveNote={(location, { title, body }) => {
            return new Promise((resolve) => {
              const now = new Date();
              pool.query(
                'insert into notes (title, body, created_at, updated_at) values ($1, $2, $3, $3) returning id',
                [title, body, now]
              ).then((result) => {
                const insertedId = result.rows[0].id;
                fs.writeFile(path.resolve(NOTES_PATH, `${insertedId}.md`), body, 'utf8', () => {
                  location.selectedId = insertedId;
                  resolve(location);
                });
              });
            })
          }}
        />
      );
    } else {
      return (
        <div className="note--empty-state">
          <span className="note-text--empty-state">
            Click a note on the left to view something! 🥺
          </span>
        </div>
      );
    }
  }

  let {id, title, body, updated_at} = note;
  const updatedAt = new Date(updated_at);

  // We could also read from a file instead.
  // body = readFile(path.resolve(`./notes/${note.id}.md`), 'utf8');

  // Now let's see how the Suspense boundary above lets us not block on this.
  // fetch('http://localhost:4000/sleep/3000');

  if (isEditing) {
    return (
      <NoteEditor
        noteId={id}
        initialTitle={title}
        initialBody={body}
        deleteNote={(location) => {
          return new Promise((resolve) => {
            pool.query('delete from notes where id = $1', [id]).then(() => {
              fs.unlink(path.resolve(NOTES_PATH, `${id}.md`), () => {
                resolve(location)
              })
            })
          })
        }}
        saveNote={(location, { title, body }) => {
          return new Promise((resolve) => {
            const now = new Date();
            const updatedId = Number(id);
            pool.query(
              'update notes set title = $1, body = $2, updated_at = $3 where id = $4',
              [title, body, now, updatedId]
            ).then(() => {
              fs.writeFile(path.resolve(NOTES_PATH, `${updatedId}.md`), body, 'utf8', () => {
                resolve(location);
              });
            });
          });
        }}
      />
    );
  } else {
    return (
      <div className="note">
        <div className="note-header">
          <h1 className="note-title">{title}</h1>
          <div className="note-menu" role="menubar">
            <small className="note-updated-at" role="status">
              Last updated on {format(updatedAt, "d MMM yyyy 'at' h:mm bb")}
            </small>
            <EditButton noteId={id}>Edit</EditButton>
          </div>
        </div>
        <NotePreview body={body} />
      </div>
    );
  }
}
