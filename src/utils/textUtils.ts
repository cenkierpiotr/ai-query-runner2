/**
 * Text post-processing utilities for AI responses.
 */

/**
 * Strips common Markdown formatting from text, leaving plain readable content.
 * Code block contents are preserved; only the fence markers are removed.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^```[\w]*\s*$/gm, '')           // ``` code fence lines
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')      // **bold**
    .replace(/\*([^*\n]+)\*/g, '$1')           // *italic*
    .replace(/^#{1,6}\s+/gm, '')               // ## headings
    .replace(/`([^`\n]+)`/g, '$1')             // `inline code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // [text](url)
    .replace(/\n{3,}/g, '\n\n')                // collapse excess blank lines
    .trim();
}
