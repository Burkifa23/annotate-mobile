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
import { database } from '../src/db'; // Ensure this path matches your folder structure
import { Task } from '../src/db/models';

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

    useEffect(() => {
        // Subscribe to Database Changes
        const subscription = database.collections.get<Task>('tasks')
            .query()
            .observe()
            .subscribe(setTasks);

        return () => subscription.unsubscribe();
    }, []);

    const createTask = async () => {
        if (!input.trim()) return;

        await database.write(async () => {
            await database.collections.get<Task>('tasks').create(task => {
                task.title = input;
                task.color = THEME.colors.tags[Math.floor(Math.random() * THEME.colors.tags.length)];
                task.priority = 0.5;
                task.isArchived = false;
                task.createdAt = new Date();
                task.updatedAt = new Date();
            });
        });

        setInput('');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            <SalienceHeader taskCount={tasks.length} />

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>{STRINGS.sectionTitle}</Text>

                <FlatList
                    data={tasks}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={[styles.card, { borderLeftColor: item.color }]}>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <View style={styles.metaRow}>
                                    <Feather name="calendar" size={12} color={THEME.colors.textTertiary} />
                                    <Text style={styles.cardMeta}>
                                        {' ' + item.createdAt.toLocaleDateString()} {STRINGS.meta.dateSeparator} {item.notes?.count ?? 0} {STRINGS.meta.notes}
                                    </Text>
                                </View>
                            </View>
                            <Feather name="chevron-right" size={20} color={THEME.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                />
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
    }
});