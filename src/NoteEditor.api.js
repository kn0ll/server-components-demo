const {unlink, writeFile} = require('fs').promises;
const path = require('path');

export const createNote = async ({pool, body: {title, body}}) => {
  const now = new Date();
  const result = await pool.query(
    'insert into notes (title, body, created_at, updated_at) values ($1, $2, $3, $3) returning id',
    [title, body, now]
  );
  const insertedId = result.rows[0].id;
  await writeFile(
    path.resolve(NOTES_PATH, `${insertedId}.md`),
    body,
    'utf8'
  );
  return insertedId;
}

export const updateNote = async ({pool, id, body: {title, body}}) => {
  const now = new Date();
  const updatedId = Number(id);
  await pool.query(
    'update notes set title = $1, body = $2, updated_at = $3 where id = $4',
    [title, body, now, updatedId]
  );
  await writeFile(
    path.resolve(NOTES_PATH, `${updatedId}.md`),
    body,
    'utf8'
  );
  return null;
}

export const deleteNote = async ({pool, id}) => {
  await pool.query('delete from notes where id = $1', [id]);
  await unlink(path.resolve(NOTES_PATH, `${id}.md`));
}

export const getNotes = async () => {
  const {rows} = await pool.query('select * from notes order by id desc');
  return rows;
}

export const getNote = async ({pool, id}) => {
  const {rows} = await pool.query('select * from notes where id = $1', [
    id,
  ]);
  return rows[0];
}
