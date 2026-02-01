import { Box } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import MarkdownIt from 'markdown-it';
import { TableOfContents } from '../components/TableOfContents/TableOfContents';
import { useMultipleMessageListeners, useSendMessage } from '../hooks/usePostMessage';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function IFramePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [markdownText, setMarkdownText] = useState<string>('');
  const [activeId, setActiveId] = useState<string>('');
  const sendToIframe = useSendMessage(iframeRef.current?.contentWindow || null);

  useEffect(() => {
    // Fetch markdown once and parse TOC
    fetch('/sample.md')
      .then((response) => response.text())
      .then((text) => {
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
      });
  }, []); // Empty dependency array - fetch only once

  // Listen for messages from iframe with type safety
  useMultipleMessageListeners({
    resize: (message) => {
      if (iframeRef.current) {
        iframeRef.current.style.height = `${message.payload}px`;
      }
    },
    'iframe-ready': () => {
      if (markdownText) {
        sendToIframe({ type: 'markdown-content', payload: markdownText });
      }
    },
    'heading-visible': (message) => {
      setActiveId(message.payload);
    },
  });

  const handleTocClick = (id: string) => {
    // Scroll to heading in parent
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        const iframeDoc = iframe.contentWindow.document;
        const element = iframeDoc.getElementById(id);
        if (element) {
          // Get iframe position in parent window
          const iframeRect = iframe.getBoundingClientRect();
          // Get element position in iframe
          const elementRect = element.getBoundingClientRect();
          // Calculate absolute position in parent
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetPosition = scrollTop + iframeRect.top + elementRect.top - 100;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
          });
        }
      } catch (e) {
        // Fallback to postMessage if cross-origin
        sendToIframe({ type: 'scrollToHeading', payload: id });
      }
    }
  };

  return (
    <Box style={{ display: 'flex', gap: '1rem', minHeight: '100vh' }}>
      <TableOfContents items={toc} onItemClick={handleTocClick} activeId={activeId} />
      <Box style={{ flex: 1 }}>
        <iframe
          ref={iframeRef}
          src="http://localhost:5173/markdown-view"
          style={{
            width: '100%',
            border: 'none',
            display: 'block',
          }}
          scrolling="no"
          title="Markdown Viewer in IFrame"
        />
      </Box>
    </Box>
  );
}
