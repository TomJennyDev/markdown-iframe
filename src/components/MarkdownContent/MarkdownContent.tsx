import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Text, Paper } from '@mantine/core';
import MarkdownIt from 'markdown-it';
import { useHeadingHighlight } from './useHeadingHighlight';
import { useMessageListener, useSendMessage } from '../../hooks/usePostMessage';
import { useMarkdownHMR } from '../../hooks/useMarkdownHMR';

interface MarkdownContentProps {
  url?: string;
}

export function MarkdownContent({ url: _url }: MarkdownContentProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sendToParent = useSendMessage(window.parent);
  const scrollPositionRef = useRef<number>(0);

  // Use custom hook for heading highlighting
  useHeadingHighlight(contentRef, content);

  // Function to render markdown
  const renderMarkdown = useCallback((text: string) => {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });

    // Custom renderer to add IDs to headings
    const defaultRender =
      md.renderer.rules.heading_open ||
      function (tokens, idx, options, _env, self) {
        return self.renderToken(tokens, idx, options);
      };

    md.renderer.rules.heading_open = function (tokens, idx, options, _env, self) {
      const token = tokens[idx];
      const textToken = tokens[idx + 1];

      if (textToken && textToken.type === 'inline') {
        const headingText = textToken.content;
        const headingId = headingText
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');

        token.attrSet('id', headingId);
      }

      return defaultRender(tokens, idx, options, _env, self);
    };

    return md.render(text);
  }, []);

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
      
      console.log('Markdown content updated without page reload');
    } catch (err) {
      console.error('Error reloading markdown:', err);
    }
  }, [renderMarkdown]);

  // Listen for markdown HMR events
  useMarkdownHMR((data) => {
    console.log('Markdown changed, reloading content...', data);
    reloadMarkdown();
  });

  // Listen for markdown content from parent with type safety
  useMessageListener('markdown-content', (message) => {
    const text = message.payload;
    const html = renderMarkdown(text);
    setContent(html);
    setLoading(false);
  });

  useEffect(() => {
    // Signal parent that iframe is ready
    sendToParent({ type: 'iframe-ready' });
  }, [sendToParent]);

  // Send height to parent for auto-resize
  useEffect(() => {
    if (!loading && content) {
      const sendHeight = () => {
        const height = document.body.scrollHeight;
        sendToParent({ type: 'resize', payload: height });
      };

      // Send height after content loads
      const timer = setTimeout(sendHeight, 100);
      
      // Observe content changes
      const observer = new MutationObserver(sendHeight);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }
  }, [loading, content, sendToParent]);

  // Listen for scroll messages from parent with type safety
  useMessageListener('scrollToHeading', (message) => {
    const element = document.getElementById(message.payload);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  if (loading) {
    return <Text>Loading markdown...</Text>;
  }

  if (error) {
    return <Text c="red">Error: {error}</Text>;
  }

  return (
    <Box style={{ minHeight: '100vh', padding: '1rem' }}>
      <Paper shadow="sm" p="xl">
        <div
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            lineHeight: 1.6,
          }}
          className="markdown-content"
        />
      </Paper>

      <style>{`
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 600;
          scroll-margin-top: 1rem;
        }

        .markdown-content h1 {
          font-size: 2rem;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 0.5rem;
        }

        .markdown-content h2 {
          font-size: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 0.3rem;
        }

        .markdown-content h3 {
          font-size: 1.25rem;
        }

        .markdown-content p {
          margin-bottom: 1rem;
        }

        .markdown-content ul,
        .markdown-content ol {
          margin-bottom: 1rem;
          padding-left: 2rem;
        }

        .markdown-content li {
          margin-bottom: 0.5rem;
        }

        .markdown-content code {
          background-color: #f5f5f5;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .markdown-content pre {
          background-color: #f5f5f5;
          padding: 1rem;
          border-radius: 5px;
          overflow-x: auto;
          margin-bottom: 1rem;
        }

        .markdown-content pre code {
          background-color: transparent;
          padding: 0;
        }

        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1rem;
        }

        .markdown-content table th,
        .markdown-content table td {
          border: 1px solid #ddd;
          padding: 0.75rem;
          text-align: left;
        }

        .markdown-content table th {
          background-color: #f5f5f5;
          font-weight: 600;
        }

        .markdown-content blockquote {
          border-left: 4px solid #ddd;
          padding-left: 1rem;
          margin-left: 0;
          margin-bottom: 1rem;
          color: #666;
          font-style: italic;
        }

        .markdown-content a {
          color: #228be6;
          text-decoration: none;
        }

        .markdown-content a:hover {
          text-decoration: underline;
        }

        .markdown-content hr {
          border: none;
          border-top: 2px solid #e0e0e0;
          margin: 2rem 0;
        }

        .markdown-content img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </Box>
  );
}
