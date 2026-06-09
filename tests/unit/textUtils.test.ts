import { describe, it, expect } from 'vitest';
import { stripMarkdown } from '../../src/utils/textUtils.js';

describe('stripMarkdown', () => {
  it('removes **bold** markers', () => {
    expect(stripMarkdown('This is **bold** text')).toBe('This is bold text');
  });

  it('removes *italic* markers', () => {
    expect(stripMarkdown('This is *italic* text')).toBe('This is italic text');
  });

  it('removes ## headings', () => {
    expect(stripMarkdown('## Section Title\nContent here')).toBe('Section Title\nContent here');
  });

  it('removes all heading levels', () => {
    expect(stripMarkdown('# H1\n## H2\n### H3')).toBe('H1\nH2\nH3');
  });

  it('removes `inline code` backticks', () => {
    expect(stripMarkdown('Call `myFunction()` here')).toBe('Call myFunction() here');
  });

  it('removes ``` code fence lines', () => {
    expect(stripMarkdown('```javascript\nconst x = 1;\n```')).toBe('const x = 1;');
  });

  it('converts [text](url) links to plain text', () => {
    expect(stripMarkdown('See [Google](https://google.com) for details')).toBe('See Google for details');
  });

  it('collapses 3+ blank lines into 2', () => {
    expect(stripMarkdown('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('trims leading/trailing whitespace', () => {
    expect(stripMarkdown('  hello  ')).toBe('hello');
  });

  it('passes plain text through unchanged', () => {
    expect(stripMarkdown('Just plain text here.')).toBe('Just plain text here.');
  });

  it('handles mixed formatting', () => {
    const input = '## Results\n\nFound **3 items** with `status: done`.\n\nSee [report](http://x.com).';
    const output = stripMarkdown(input);
    expect(output).not.toContain('##');
    expect(output).not.toContain('**');
    expect(output).not.toContain('`');
    expect(output).not.toContain('[report]');
    expect(output).toContain('Results');
    expect(output).toContain('3 items');
  });

  it('preserves code block content', () => {
    const input = '```\nconst answer = 42;\n```';
    expect(stripMarkdown(input)).toContain('const answer = 42;');
  });

  it('handles empty string', () => {
    expect(stripMarkdown('')).toBe('');
  });
});
