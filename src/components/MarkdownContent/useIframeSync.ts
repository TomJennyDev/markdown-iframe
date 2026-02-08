import { useEffect } from 'react';
import { useMessageListener, useSendMessage } from '../../hooks/usePostMessage';

export const useIframeSync = (
  loading: boolean,
  content: string
) => {
  const sendToParent = useSendMessage(window.parent);

  // Signal parent that iframe is ready
  useEffect(() => {
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

  // Listen for scroll messages from parent
  useMessageListener('scrollToHeading', (message) => {
    const element = document.getElementById(message.payload);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
};
