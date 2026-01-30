import { Model } from '@nozbe/watermelondb';
import { field, text, date, children, writer, immutableRelation } from '@nozbe/watermelondb/decorators';

// --- TASK MODEL ---
export class Task extends Model {
    static table = 'tasks';
    static associations = {
        notes: { type: 'has_many', foreignKey: 'task_id' },
    } as const;

    @text('title') title!: string;
    @text('color') color!: string;
    @field('priority') priority!: number;
    @field('is_archived') isArchived!: boolean;
    @date('created_at') createdAt!: Date;
    @date('updated_at') updatedAt!: Date;

    // Link to Notes
    @children('notes') notes!: any;

    // Helper: easy way to add a note to this task
    @writer async addNote(content: string, type: 'note' | 'clip' = 'note') {
        return await this.collections.get<Note>('notes').create(note => {
            note.task.set(this);
            note.content = content;
            note.type = type;
            note.createdAt = new Date();
        });
    }
}

// --- NOTE MODEL ---
export class Note extends Model {
    static table = 'notes';
    static associations = {
        tasks: { type: 'belongs_to', key: 'task_id' },
    } as const;

    @text('content') content!: string;
    @text('type') type!: string;
    @text('page_url') pageUrl!: string | null;
    @text('page_title') pageTitle!: string | null;
    @text('excerpt') excerpt!: string | null;
    @date('created_at') createdAt!: Date;

    // Link back to Task
    @field('task_id') taskId!: string;
    @immutableRelation('tasks', 'task_id') task!: any;
}