
import { CsvRow } from '../types';

// Keywords to detect columns
const CONTENT_KEYWORDS = ['post', 'tweet', 'copy', 'text', 'content', 'caption', 'message', 'body'];
const LIKES_KEYWORDS = ['likes', 'engagement', 'favorites', 'reactions', 'score', 'hearts', 'upvotes'];

export const parseCsvTrainingData = async (file: File): Promise<CsvRow[]> => {
    const text = await file.text();
    const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);

    if (rows.length < 2) throw new Error("CSV file is empty or missing data.");

    // Simple CSV parser that handles quoted strings
    const parseRow = (row: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result.map(cell => cell.replace(/^"|"$/g, '').replace(/""/g, '"'));
    };

    const headers = parseRow(rows[0].toLowerCase());

    // Detect indices
    let contentIndex = -1;
    let likesIndex = -1;

    // 1. Exact match attempt
    contentIndex = headers.findIndex(h => CONTENT_KEYWORDS.includes(h));
    likesIndex = headers.findIndex(h => LIKES_KEYWORDS.includes(h));

    // 2. Fuzzy match attempt (if not found)
    if (contentIndex === -1) {
        contentIndex = headers.findIndex(h => CONTENT_KEYWORDS.some(k => h.includes(k)));
    }
    if (likesIndex === -1) {
        likesIndex = headers.findIndex(h => LIKES_KEYWORDS.some(k => h.includes(k)));
    }

    if (contentIndex === -1) {
        throw new Error(`Could not identify a 'Content' column. Found headers: ${headers.join(', ')}`);
    }

    const validData: CsvRow[] = [];

    // Regex to match URLs (http, https, ftp)
    const urlRegex = /(?:https?|ftp):\/\/[\n\S]+/g;

    for (let i = 1; i < rows.length; i++) {
        const cols = parseRow(rows[i]);
        // We only strictly need contentIndex to exist in this row
        if (cols.length <= contentIndex) continue;

        let content = cols[contentIndex];

        // Strip URLs from content
        content = content.replace(urlRegex, '').trim();

        let likes = 0;

        // Try to parse likes if column exists (OPTIONAL)
        if (likesIndex !== -1 && cols.length > likesIndex) {
            const likesStr = cols[likesIndex].replace(/,/g, '');
            const parsed = parseInt(likesStr, 10);
            if (!isNaN(parsed)) {
                likes = parsed;
            }
        }

        if (content) {
            validData.push({ content, likes });
        }
    }

    // Sort by likes descending (if likes exist, otherwise order doesn't matter much)
    // If no likes were found, all likes are 0, so order is preserved.
    return validData.sort((a, b) => b.likes - a.likes);
};