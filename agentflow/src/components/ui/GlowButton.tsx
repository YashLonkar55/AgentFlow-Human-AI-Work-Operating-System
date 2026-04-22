'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlowButtonProps {
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'ghost' | 'danger';
}

export default function GlowButton({
    onClick, disabled, loading, children, className, variant = 'primary',
}: GlowButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled || loading}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            className={cn(
                'relative flex items-center justify-center gap-2',
                'h-10 px-4 rounded-xl text-sm font-bold',
                'transition-all duration-200 select-none shadow-sm',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
                variant === 'primary' && [
                    'bg-gradient-to-r from-blue-500 to-violet-600 text-white',
                    'hover:shadow-lg hover:shadow-violet-200',
                ],
                variant === 'ghost' && [
                    'bg-white border border-black/[0.08] text-gray-600',
                    'hover:bg-gray-50 hover:text-gray-900',
                ],
                variant === 'danger' && [
                    'bg-red-50 border border-red-200 text-red-600',
                    'hover:bg-red-100',
                ],
                className,
            )}
        >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : children}
        </motion.button>
    );
}