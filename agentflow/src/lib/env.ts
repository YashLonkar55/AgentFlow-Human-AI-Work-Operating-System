function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${key}\n` +
            `Add it to your .env.local file.`,
        );
    }
    return value;
}

export const env = {
    openRouterApiKey: () => requireEnv('OPENROUTER_API_KEY'),
    databaseUrl: () => requireEnv('DATABASE_URL'),
    clerkSecretKey: () => requireEnv('CLERK_SECRET_KEY'),
};

export function validateGoal(goal: unknown): string {
    if (!goal || typeof goal !== 'string') {
        throw new Error('Goal must be a non-empty string.');
    }
    const trimmed = goal.trim();
    if (trimmed.length < 3) throw new Error('Goal must be at least 3 characters.');
    if (trimmed.length > 500) throw new Error('Goal must be under 500 characters.');
    return trimmed;
}

export function validateStepId(id: unknown): string {
    if (!id || typeof id !== 'string') throw new Error('Invalid step ID.');
    return id;
}