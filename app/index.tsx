import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { database } from '../src/db';
import { Task, Note } from '../src/db/models';

// Suppress expo-router NONE error (non-fatal compatibility issue)
if (typeof ErrorUtils !== 'undefined') {
    const originalGlobalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        if (error.message?.includes("Cannot assign to read-only property 'NONE'")) {
            console.warn('Suppressed expo-router NONE error (non-fatal)');
            return; // Suppress this specific error
        }
        // Call original handler for other errors
        if (originalGlobalHandler) {
            originalGlobalHandler(error, isFatal);
        }
    });
}

// --- 1. CONFIGURATION ---

const STRINGS = {
    header: {
        session: "SESSION",
        focus: "FOCUS",
        tasks: "TASKS",
        sessionValue: "42m",
        focusValue: "85%",
    },
    sectionTitle: "Active Research",
    inputPlaceholder: "New Research Topic...",
    meta: {
        notes: "Notes",
        dateSeparator: "•"
    }
};

const THEME = {
    colors: {
        background: '#121212',
        card: '#1E1E1E',
        border: '#333333',
        primary: '#3B82F6',
        textPrimary: '#FFFFFF',
        textSecondary: '#888888',
        textTertiary: '#666666',
        success: '#10B981',
        inputBackground: 'rgba(30,30,30,0.9)',
        inputPlaceholder: '#666666',
        tags: [
            '#3B82F6',
            '#F59E0B',
            '#10B981',
            '#64748B',
        ]
    },
    spacing: {
        sm: 8,
        md: 16,
        lg: 24
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16
    }
};

// --- 2. SUB-COMPONENTS ---

const TaskCard = ({ item }: { item: Task }) => {
    const [noteCount, setNoteCount] = useState(0);

    useEffect(() => {
        const subscription = item.notes
            .observe()
            .subscribe((notes: Note[]) => {
                setNoteCount(notes.length);
            });

        return () => subscription.unsubscribe();
    }, [item.id]);

    return (
        <TouchableOpacity style={[styles.card, { borderLeftColor: item.color }]}>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.metaRow}>
                    <Feather name="calendar" size={12} color={THEME.colors.textTertiary} />
                    <Text style={styles.cardMeta}>
                        {' ' + item.createdAt.toLocaleDateString()} {STRINGS.meta.dateSeparator} {noteCount} {STRINGS.meta.notes}
                    </Text>
                </View>
            </View>
            <Feather name="chevron-right" size={20} color={THEME.colors.textSecondary} />
        </TouchableOpacity>
    );
};

const SalienceHeader = ({ taskCount }: { taskCount: number }) => (
    <View style={styles.salienceContainer}>
        <BlurView intensity={20} tint="dark" style={styles.salienceStrip}>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>{STRINGS.header.session}</Text>
                <Text style={styles.statValue}>{STRINGS.header.sessionValue}</Text>
            </View>

            <View style={styles.verticalLine} />

            <View style={styles.statBox}>
                <Text style={styles.statLabel}>{STRINGS.header.focus}</Text>
                <Text style={[styles.statValue, { color: THEME.colors.success }]}>
                    {STRINGS.header.focusValue}
                </Text>
            </View>

            <View style={styles.verticalLine} />

            <View style={styles.statBox}>
                <Text style={styles.statLabel}>{STRINGS.header.tasks}</Text>
                <Text style={styles.statValue}>{taskCount}</Text>
            </View>
        </BlurView>
    </View>
);

// --- 3. MAIN COMPONENT ---

export default function Dashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Subscribe to Database Changes
        let subscription: any;
        let timeoutId: NodeJS.Timeout;
        let isMounted = true;
        
        const initializeDatabase = async () => {
            try {
                console.log('=== Database Initialization Start ===');
                
                // Check if database object exists
                if (!database) {
                    console.error('❌ Database object is not available');
                    clearTimeout(timeoutId);
                    if (isMounted) {
                        setError('Database not available. WatermelonDB requires native code. If using Expo Go, you need a development build. Run: npx expo prebuild && npx expo run:android');
                        setLoading(false);
                        setTasks([]);
                    }
                    return;
                }

                // Add a shorter timeout to detect if database never responds
                timeoutId = setTimeout(() => {
                    if (isMounted && loading) {
                        console.error('⏱️ Database subscription timeout after 5 seconds');
                        console.error('⚠️ Showing UI anyway - database may not be available');
                        setError('Database not available. App will work but data won\'t persist. If using Expo Go, you need a development build.');
                        setLoading(false);
                        setTasks([]); // Show empty state
                    }
                }, 5000); // 5 second timeout

                // Test database connection first - try a simple query
                try {
                    console.log('📊 Testing database connection...');
                    const testQuery = await database.collections.get<Task>('tasks').query().fetch();
                    console.log(`✅ Database connection successful. Found ${testQuery.length} existing tasks.`);
                } catch (queryError) {
                    console.error('❌ Database query test failed:', queryError);
                    // Clear timeout and show error immediately
                    clearTimeout(timeoutId);
                    if (isMounted) {
                        setError('Database connection failed. If using Expo Go, WatermelonDB requires a development build.');
                        setLoading(false);
                        setTasks([]);
                    }
                    return;
                }

                console.log('👂 Setting up database observation...');
                subscription = database.collections.get<Task>('tasks')
                    .query()
                    .observe()
                    .subscribe({
                        next: (tasks: Task[]) => {
                            if (!isMounted) {
                                console.log('⚠️ Component unmounted, ignoring update');
                                return;
                            }
                            console.log(`✅ Database subscription received ${tasks.length} tasks`);
                            clearTimeout(timeoutId);
                            setTasks(tasks);
                            setLoading(false);
                            setError(null);
                        },
                        error: (err: Error) => {
                            if (!isMounted) return;
                            console.error('❌ Database subscription error:', err);
                            console.error('Error message:', err.message);
                            console.error('Error stack:', err.stack);
                            clearTimeout(timeoutId);
                            setError(`Database error: ${err.message}. If using Expo Go, you need a development build.`);
                            setLoading(false);
                            setTasks([]);
                        }
                    });
                console.log('✅ Database subscription set up successfully');
            } catch (err: unknown) {
                if (!isMounted) return;
                console.error('❌ Database initialization error:', err);
                if (err instanceof Error) {
                    console.error('Error message:', err.message);
                    console.error('Error stack:', err.stack);
                }
                clearTimeout(timeoutId);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(`Database failed: ${errorMessage}. If using Expo Go, WatermelonDB requires a development build.`);
                setLoading(false);
                setTasks([]);
            }
        };

        // Start initialization immediately
        initializeDatabase();

        return () => {
            console.log('🧹 Cleaning up database subscription');
            isMounted = false;
            clearTimeout(timeoutId);
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    const createTask = async () => {
        if (!input.trim()) return;

        try {
            await database.write(async () => {
                await database.collections.get<Task>('tasks').create((task: Task) => {
                    task.title = input.trim();
                    task.color = THEME.colors.tags[Math.floor(Math.random() * THEME.colors.tags.length)];
                    task.priority = 0.5;
                    task.isArchived = false;
                    task.createdAt = new Date();
                    task.updatedAt = new Date();
                });
            });
            setInput('');
        } catch (err) {
            console.error('Error creating task:', err);
            setError('Failed to create task');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            <SalienceHeader taskCount={tasks.length} />

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>{STRINGS.sectionTitle}</Text>

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Text style={styles.errorHelpText}>
                            To fix: Run "npx expo prebuild" then "npx expo run:android" to create a development build.
                        </Text>
                    </View>
                )}
                
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading tasks...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={tasks}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No tasks yet. Create one below!</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TaskCard item={item} />
                        )}
                    />
                )}
            </View>

            <View style={styles.inputWrapper}>
                <BlurView intensity={80} tint="dark" style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder={STRINGS.inputPlaceholder}
                        placeholderTextColor={THEME.colors.inputPlaceholder}
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={createTask}
                    />
                    <TouchableOpacity onPress={createTask} style={styles.addButton}>
                        <Feather name="plus" size={24} color="#FFF" />
                    </TouchableOpacity>
                </BlurView>
            </View>
        </SafeAreaView>
    );
}

// --- 4. STYLES ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background
    },
    salienceContainer: {
        marginHorizontal: THEME.spacing.md,
        marginTop: THEME.spacing.sm,
        borderRadius: THEME.borderRadius.md,
        overflow: 'hidden'
    },
    salienceStrip: {
        flexDirection: 'row',
        paddingVertical: 15,
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    statBox: {
        alignItems: 'center'
    },
    statLabel: {
        color: THEME.colors.textSecondary,
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 2
    },
    statValue: {
        color: THEME.colors.textPrimary,
        fontSize: 18,
        fontWeight: '600'
    },
    verticalLine: {
        width: 1,
        height: '80%',
        backgroundColor: THEME.colors.border
    },
    content: {
        flex: 1,
        padding: THEME.spacing.md
    },
    sectionTitle: {
        color: THEME.colors.textPrimary,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: THEME.spacing.md,
        marginTop: 10
    },
    card: {
        backgroundColor: THEME.colors.card,
        borderRadius: THEME.borderRadius.md,
        marginBottom: 12,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16
    },
    cardContent: {
        flex: 1
    },
    cardTitle: {
        color: THEME.colors.textPrimary,
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    cardMeta: {
        color: THEME.colors.textTertiary,
        fontSize: 12
    },
    inputWrapper: {
        position: 'absolute',
        bottom: 30,
        left: 16,
        right: 16,
        borderRadius: THEME.borderRadius.lg,
        overflow: 'hidden'
    },
    inputBar: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: THEME.colors.inputBackground
    },
    input: {
        flex: 1,
        backgroundColor: '#2C2C2C',
        borderRadius: 10,
        color: '#FFF',
        paddingHorizontal: 16,
        height: 50,
        marginRight: 10
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: THEME.colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40
    },
    loadingText: {
        color: THEME.colors.textSecondary,
        fontSize: 14,
        marginBottom: 4
    },
    loadingSubtext: {
        color: THEME.colors.textTertiary,
        fontSize: 12
    },
    errorContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        marginBottom: 8
    },
    errorHelpText: {
        color: '#F59E0B',
        fontSize: 12,
        marginTop: 4
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center'
    },
    emptyText: {
        color: THEME.colors.textSecondary,
        fontSize: 14
    }
});