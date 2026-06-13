import ePub, { Book, NavItem, Rendition } from 'epubjs';


async function extractSentenceByCfiRange(book: Book, cfiRange: string): Promise<{ text: string, sentence: string }> {
    const range = await book.getRange(cfiRange);
    const text = range.toString().trim();
    if (!text) return { text: '', sentence: '' };

    let context = '';

    if (range && range.commonAncestorContainer) {
        const container = range.commonAncestorContainer;
        let paragraphText = '';
        if (container.nodeType === Node.TEXT_NODE && container.textContent) {
            paragraphText = container.textContent;
        } else if ('textContent' in container) {
            paragraphText = (container as Text).textContent || '';
        }

        if (paragraphText) {
            const startOffset = range.startOffset;
            const sentencePattern = /[^.!?。！？\n]+[.!?。！？]+/g;
            const sentences = paragraphText.match(sentencePattern) || [paragraphText];

            let containingSentence = '';
            let accumulatedLength = 0;

            for (const sentence of sentences) {
                const sentenceStart = accumulatedLength;
                const sentenceEnd = accumulatedLength + sentence.length;

                if (startOffset >= sentenceStart && startOffset < sentenceEnd) {
                    containingSentence = sentence.trim();
                    break;
                }
                accumulatedLength += sentence.length;
            }

            if (!containingSentence && sentences.length === 1) {
                containingSentence = sentences[0].trim();
            }

            if (containingSentence) {
                context = containingSentence;
            } else {
                const selectedLower = text.toLowerCase();
                const paragraphLower = paragraphText.toLowerCase();
                const matchIndex = paragraphLower.indexOf(selectedLower);

                if (matchIndex >= 0) {
                    accumulatedLength = 0;
                    for (const sentence of sentences) {
                        const sentenceStart = accumulatedLength;
                        const sentenceEnd = accumulatedLength + sentence.length;

                        if (matchIndex >= sentenceStart && matchIndex < sentenceEnd) {
                            containingSentence = sentence.trim();
                            break;
                        }
                        accumulatedLength += sentence.length;
                    }
                    if (containingSentence) {
                        context = containingSentence;
                    }
                }
            }
        }

        if (!context || context.length < text.length) {
            context = text;
        }

        if (context.length > 300) {
            const textIndex = context.toLowerCase().indexOf(text.toLowerCase());
            if (textIndex >= 0) {
                const contextStart = Math.max(0, textIndex - 100);
                const contextEnd = Math.min(context.length, textIndex + text.length + 100);
                context = (contextStart > 0 ? '...' : '') +
                    context.substring(contextStart, contextEnd).trim() +
                    (contextEnd < context.length ? '...' : '');
            }
        }
        return { text: text, sentence: context };
    }
    return { text: '', sentence: '' };
}

function unfoldNavigation(toc: Array<NavItem>): any[] {
    if (!toc) {
        return [];
    }
    const processOutline = (items: any[]): any[] => {
        return items.map(item => ({
            title: item.label,
            dest: item.href,
            items: item.subitems && item.subitems.length > 0
                ? processOutline(item.subitems)
                : undefined
        }));
    };
    return processOutline(toc);
}

export { extractSentenceByCfiRange, unfoldNavigation }