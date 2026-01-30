import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Platform } from 'react-native';
import { mySchema } from './schema';
import { Task, Note } from './models';

// Native adapter using SQLite (iOS/Android)
const adapter = new SQLiteAdapter({
    schema: mySchema,
    // (JSI) is a C++ bridge that makes this fast. 
    // Disable JSI on Android if it causes crashes, enable for better performance
    jsi: false, // Disable JSI for better Android compatibility
    onSetUpError: (error: Error) => {
        console.error("Database failed to load:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
    },
});

export const database = new Database({
    adapter,
    modelClasses: [Task, Note],
});

// Log database initialization
console.log(`Database initialized for platform: ${Platform.OS}`);
