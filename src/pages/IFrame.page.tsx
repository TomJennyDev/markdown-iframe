import { Box } from '@mantine/core';
import { useRef, useState } from 'react';
import { TableOfContents } from '../components/TableOfContents/TableOfContents';
import { useMultipleMessageListeners, useSendMessage } from '../hooks/usePostMessage';
import { useMarkdownLoader } from '../hooks/useMarkdownLoader';
import { useIframeScroll } from '../hooks/useIframeScroll';

export function IFramePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeId, setActiveId] = useState<string>('');
  const sendToIframe = useSendMessage(iframeRef.current?.contentWindow || null);

  // Load markdown and parse TOC
  const { toc, markdownText } = useMarkdownLoader({
    sendToIframe,
    iframeContentWindow: iframeRef.current?.contentWindow || null,
  });

  // Handle scroll to heading
  const { handleTocClick } = useIframeScroll({
    iframeRef,
    sendToIframe,
  });

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
    'scrollToHeadingFromIframe': (message) => {
      handleTocClick(message.payload);
    },
  });

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
