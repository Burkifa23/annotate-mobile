import { Database } from '@nozbe/watermelondb';
import LokijsAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { mySchema } from './schema';
import { Task, Note } from './models';

// Web-specific adapter using Lokijs (IndexedDB)
const adapter = new LokijsAdapter({
    schema: mySchema,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    onSetUpError: (error: Error) => {
        console.error("Database failed to load:", error);
    },
});

export const database = new Database({
    adapter,
    modelClasses: [Task, Note],
});
