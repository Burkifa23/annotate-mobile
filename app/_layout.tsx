// Patch console.error FIRST before any imports to catch expo-router NONE error
if (typeof console !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
        // Check all arguments for the NONE error message
        const errorMessage = args.map(arg => {
            if (typeof arg === 'string') return arg;
            if (arg instanceof Error) return arg.message;
            if (arg && typeof arg === 'object') return JSON.stringify(arg);
            return String(arg);
        }).join(' ');
        
        if (errorMessage.includes("Cannot assign to read-only property 'NONE'")) {
            // Suppress this specific non-fatal expo-router error
            return;
        }
        originalConsoleError.apply(console, args);
    };
}

// Also patch console.warn to catch it if logged as warning
if (typeof console !== 'undefined' && console.warn) {
    const originalConsoleWarn = console.warn;
    console.warn = (...args: any[]) => {
        const errorMessage = args.map(arg => String(arg)).join(' ');
        if (errorMessage.includes("Cannot assign to read-only property 'NONE'")) {
            return;
        }
        originalConsoleWarn.apply(console, args);
    };
}

// Patch React Native's error reporting
if (typeof ErrorUtils !== 'undefined') {
    const originalGlobalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        if (error.message?.includes("Cannot assign to read-only property 'NONE'")) {
            // Suppress this specific error
            return;
        }
        if (originalGlobalHandler) {
            originalGlobalHandler(error, isFatal);
        }
    });
}

import { Stack } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Error boundary to suppress expo-router NONE error
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        if (error.message?.includes("Cannot assign to read-only property 'NONE'")) {
            return { hasError: false, error: null };
        }
        return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
        if (error.message?.includes("Cannot assign to read-only property 'NONE'")) {
            return;
        }
        console.error('Error:', error);
    }

    render() {
        if (this.state.hasError && this.state.error) {
            return (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Error: {this.state.error.message}</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

export default function RootLayout() {
    return (
        <ErrorBoundary>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#121212' }
                }}
            />
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
        padding: 20,
    },
    errorText: {
        color: '#FFFFFF',
        fontSize: 18,
    },
});
