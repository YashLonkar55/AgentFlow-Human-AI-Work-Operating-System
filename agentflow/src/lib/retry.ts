interface RetryOptions {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
): Promise<T> {
    const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;

    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));

            const isRateLimit =
                lastError.message.includes('429') ||
                lastError.message.includes('rate limit') ||
                lastError.message.includes('too many requests');

            const isRetryable =
                isRateLimit ||
                lastError.message.includes('500') ||
                lastError.message.includes('502') ||
                lastError.message.includes('503') ||
                lastError.message.includes('timeout');

            if (!isRetryable || attempt === maxAttempts) throw lastError;

            /* Exponential backoff with jitter */
            const delay = Math.min(
                baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500,
                maxDelayMs,
            );

            console.log(`[retry] attempt ${attempt} failed: ${lastError.message}. Retrying in ${Math.round(delay)}ms...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }

    throw lastError;
}