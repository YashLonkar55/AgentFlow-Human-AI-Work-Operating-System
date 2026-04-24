import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
});

export const planningModel = openrouter('openai/gpt-5-nano');