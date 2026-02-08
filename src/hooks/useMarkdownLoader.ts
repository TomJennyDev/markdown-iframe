import { useState, useCallback, useEffect } from 'react';
import MarkdownIt from 'markdown-it';
import { useMarkdownHMR } from './useMarkdownHMR';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface UseMarkdownLoaderOptions {
  sendToIframe: (message: { type: string; payload: string }) => void;
  iframeContentWindow: Window | null;
}

export const useMarkdownLoader = ({ sendToIframe, iframeContentWindow }: UseMarkdownLoaderOptions) => {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [markdownText, setMarkdownText] = useState<string>('');

  const loadMarkdown = useCallback(async () => {
    try {
      const response = await fetch(`/sample.md?t=${Date.now()}`);
      const text = await response.text();
      setMarkdownText(text);
      
      const md = new MarkdownIt();
      const tokens = md.parse(text, {});
      const tocItems: TocItem[] = [];

      tokens.forEach((token, idx) => {
        if (token.type === 'heading_open') {
          const level = parseInt(token.tag.substring(1), 10);
          const textToken = tokens[idx + 1];
          if (textToken && textToken.type === 'inline') {
            const headingText = textToken.content;
            const headingId = headingText
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');

            tocItems.push({
              id: headingId,
              text: headingText,
              level,
            });
          }
        }
      });

      setToc(tocItems);
      
      // Send updated content to iframe
      if (iframeContentWindow) {
        sendToIframe({ type: 'markdown-content', payload: text });
      }
    } catch (error) {
      console.error('Error loading markdown:', error);
    }
  }, [sendToIframe, iframeContentWindow]);

  // Initial load
  useEffect(() => {
    loadMarkdown();
  }, [loadMarkdown]);

  // Listen for markdown HMR events
  useMarkdownHMR(() => {
    loadMarkdown();
  });

  return { toc, markdownText };
};
