'use client';

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function ErrorFallback({
    error, resetErrorBoundary,
}: {
    error: unknown;
    resetErrorBoundary: () => void;
}) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full min-h-[200px]
                 text-center px-8 py-12"
        >
            <div className="w-14 h-14 rounded-3xl bg-red-50 border border-red-200
                      flex items-center justify-center mb-4 shadow-sm">
                <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>

            <h3 className="text-sm font-bold text-gray-800 mb-2">Something went wrong</h3>
            <p className="text-xs text-gray-500 font-medium mb-5 max-w-xs leading-relaxed">
                {message}
            </p>

            <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={resetErrorBoundary}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                   bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-sm"
            >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
            </motion.button>
        </motion.div>
    );
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <ReactErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={(error: unknown) => console.error('[ErrorBoundary]', error)}
        >
            {children}
        </ReactErrorBoundary>
    );
}