/**
 * Sanitize user-provided text before interpolating into AI prompts.
 * Strips patterns commonly used for prompt injection.
 */
export function sanitizeUserInput(input: string): string {
    if (!input) return '';

    return input
        // Remove attempts to override system instructions
        .replace(/system\s*instruction/gi, '')
        .replace(/ignore\s*(all\s*)?(previous|above|prior)\s*(instructions?|prompts?|rules?)/gi, '')
        .replace(/you\s+are\s+now/gi, '')
        .replace(/new\s+instructions?:/gi, '')
        // Remove prompt separator patterns that could break prompt structure
        .replace(/[#]{4,}/g, '')
        .replace(/[=]{4,}/g, '')
        .replace(/[-]{4,}/g, '')
        .trim()
        .slice(0, 10000); // Hard length limit
}
