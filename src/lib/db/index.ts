import { LocalDatabase } from './local';

/* The one database the app uses. Today: this browser's storage. When Firebase
   is set up, this is where FirebaseDatabase gets chosen for a signed-in user
   (see firebase.ts) — the screens only ever see the Database interface. */

export const APP_ID = 'pike';

export const db = new LocalDatabase(APP_ID, 'pike.db.v1');

export type { Database, DocData, DocRef, CollectionRef, DocSnapshot, Backup } from './types';
export { DbError } from './local';
