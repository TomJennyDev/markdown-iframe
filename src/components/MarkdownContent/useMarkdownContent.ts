import { useState, useCallback, useRef } from 'react';
import { useMarkdownRenderer } from './useMarkdownRenderer';
import { useMarkdownHMR } from '../../hooks/useMarkdownHMR';
import { useMessageListener } from '../../hooks/usePostMessage';

export const useMarkdownContent = () => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const renderMarkdown = useMarkdownRenderer();

  // Function to reload markdown content
  const reloadMarkdown = useCallback(async () => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY;

    try {
      // Re-fetch the markdown file with cache busting
      const response = await fetch(`/sample.md?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch markdown');
      }
      const text = await response.text();
      const html = renderMarkdown(text);
      
      setContent(html);
      
      // Restore scroll position after content updates
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
      });
    } catch (err) {
      console.error('Error reloading markdown:', err);
      setError(err instanceof Error ? err.message : 'Failed to load markdown');
    }
  }, [renderMarkdown]);

  // Listen for markdown HMR events
  useMarkdownHMR(() => {
    reloadMarkdown();
  });

  // Listen for markdown content from parent with type safety
  useMessageListener('markdown-content', (message) => {
    const text = message.payload;
    const html = renderMarkdown(text);
    setContent(html);
    setLoading(false);
  });

  return { content, loading, error, setError };
};
