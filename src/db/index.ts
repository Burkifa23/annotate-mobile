import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from './schema';
import { Task, Note } from './models';

const adapter = new SQLiteAdapter({
    schema: mySchema,
    // (JSI) is a C++ bridge that makes this fast. 
    // If this crashes on iOS, set it to false.
    jsi: true,
    onSetUpError: error => {
        console.error("Database failed to load:", error);
    },
});

export const database = new Database({
    adapter,
    modelClasses: [Task, Note],
});