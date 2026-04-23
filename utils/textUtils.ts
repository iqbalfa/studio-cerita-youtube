// Helper to distribute items into buckets
export const distributeItems = (items: string[], count: number, separator: string): string[] => {
    const result: string[] = new Array(count).fill("");
    const base = Math.floor(items.length / count);
    const extra = items.length % count;
    let current = 0;

    for (let i = 0; i < count; i++) {
        const take = base + (i < extra ? 1 : 0);
        const slice = items.slice(current, current + take);
        result[i] = slice.join(separator);
        current += take;
    }
    return result;
};

// Robust text distributor that falls back from Sentences -> Clauses -> Words
export const distributeText = (text: string, count: number): string[] => {
    if (count <= 1) return [text];
    const cleanText = text.trim();
    if (!cleanText) return new Array(count).fill("");

    // Strategy 1: Split by Sentences
    const sentenceRegex = /[^.!?\n]+[.!?]+|[^.!?\n]+$/g;
    const sentences = cleanText.match(sentenceRegex)?.map(s => s.trim()).filter(s => s) || [cleanText];

    if (sentences.length >= count) {
        return distributeItems(sentences, count, " ");
    }

    // Strategy 2: Split by Clauses (Commas, Semicolons)
    const clauseParts = cleanText.split(/([,;])/);
    const clauses: string[] = [];
    for (let i = 0; i < clauseParts.length; i += 2) {
        const part = clauseParts[i];
        const delim = clauseParts[i + 1] || "";
        const combined = (part + delim).trim();
        if (combined) clauses.push(combined);
    }

    if (clauses.length >= count) {
        return distributeItems(clauses, count, " ");
    }

    // Strategy 3: Split by Words (Fallback)
    const words = cleanText.split(/\s+/);
    return distributeItems(words, count, " ");
};

// Enforce 4-15 visible words per segment (sound cues like [pause 1s] are excluded from count).
// Adds punctuation at natural breakpoints to chunk oversized text.
export const enforceTTSWordRange = (text: string): string => {
    // Strip sound cues for word counting purposes
    const stripped = text.replace(/\[[\s\w]+\]/g, '').trim();
    const words = stripped.split(/\s+/).filter(w => w.length > 0);

    if (words.length <= 15) return text;
    if (words.length < 4) return text;

    const breakpoints = [',', 'dan', 'atau', 'tetapi', 'karena', 'jadi', 'bahwa', 'jika', 'meski', 'namun', '&', '-'];

    const result: string[] = [];
    let current: string[] = [];
    let wordCount = 0;
    let pendingWord: string | null = null;

    const allTokens = text.split(/(\s+)/);
    let i = 0;

    while (i < allTokens.length) {
        const token = allTokens[i];

        // Skip sound cues for word count, keep them in stream
        if (token.match(/^\[[\s\w]+\]$/)) {
            current.push(token);
            i++;
            continue;
        }

        if (token.trim() === '') {
            current.push(token);
            i++;
            continue;
        }

        wordCount++;
        const isBreakpoint = breakpoints.some(bp => token.toLowerCase().replace(/[.,;!?]*$/, '') === bp);
        current.push(token);

        // Push chunk: natural breakpoint found (before/at word 15), or forced at word 15, or last word
        if ((isBreakpoint || wordCount >= 10) && wordCount <= 15) {
            // Look ahead for breakpoint in remaining tokens
            const lookAhead = allTokens.slice(i + 1).join('');
            const hasBpAhead = breakpoints.some(bp => lookAhead.toLowerCase().includes(bp));

            if (isBreakpoint || wordCount === 15 || i === allTokens.length - 1) {
                // Finalize current chunk
                let last = current[current.length - 1];
                if (last && !last.endsWith('.') && !last.match(/^\[[\s\w]+\]$/)) {
                    current[current.length - 1] = last.replace(/[,;!?]*$/, '') + '.';
                } else if (last && !last.endsWith('.') && !last.match(/^\[/)) {
                    current[current.length - 1] = last.replace(/[,;!?]*$/, '') + '.';
                }
                result.push(current.join('').trim());
                current = [];
                wordCount = 0;
            }
        }

        i++;
    }

    // Remaining words — add as final chunk (ensure period)
    if (current.length > 0) {
        const joined = current.join('').trim();
        const last = current[current.length - 1] || '';
        if (last && !last.endsWith('.') && !last.match(/^\[[\s\w]+\]$/)) {
            result.push(joined.replace(/[,;!?]*$/, '') + '.');
        } else {
            result.push(joined);
        }
    }

    // If still too many chunks (e.g. 4 sentences of 4 words each = too few per chunk), join small chunks
    const final = result.map(chunk => chunk.trim()).join(' ');
    return final;
};
