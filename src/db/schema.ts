import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
    version: 1,
    tables: [
        // 1. TASKS (Your "Left Panel" items)
        tableSchema({
            name: 'tasks',
            columns: [
                { name: 'title', type: 'string' },
                { name: 'color', type: 'string' }, // e.g. "#3B82F6"
                { name: 'priority', type: 'number' }, // 0.1 to 1.0
                { name: 'is_archived', type: 'boolean' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ],
        }),
        // 2. NOTES (Your "Right Sidebar" items)
        tableSchema({
            name: 'notes',
            columns: [
                { name: 'content', type: 'string' },
                { name: 'type', type: 'string' }, // "note", "clip", "highlight"
                { name: 'task_id', type: 'string', isIndexed: true }, // Links to a Task
                { name: 'page_url', type: 'string', isOptional: true }, // From Chrome
                { name: 'page_title', type: 'string', isOptional: true },
                { name: 'excerpt', type: 'string', isOptional: true }, // Highlighted text
                { name: 'created_at', type: 'number' },
            ],
        }),
    ],
});