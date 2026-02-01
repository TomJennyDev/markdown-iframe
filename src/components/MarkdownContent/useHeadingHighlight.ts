import { useEffect, useRef } from 'react';
import { useSendMessage } from '../../hooks/usePostMessage';

export const useHeadingHighlight = (
  contentRef: React.RefObject<HTMLDivElement>,
  content: string
) => {
  const sendMessage = useSendMessage(window.parent);
  const currentActiveIdRef = useRef<string>('');
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!content || !contentRef.current) {
      return;
    }

    const updateActiveHeading = () => {
      const headings = contentRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (!headings || headings.length === 0) {return;}

      // Get iframe position in parent window
      const iframe = window.frameElement as HTMLIFrameElement | null;
      if (!iframe) {return;}

      const iframeRect = iframe.getBoundingClientRect();
      const parentScrollTop = window.parent.pageYOffset || window.parent.document.documentElement.scrollTop;
      const parentScrollHeight = window.parent.document.documentElement.scrollHeight;
      const parentWindowHeight = window.parent.innerHeight;

      // Check if we're at the bottom of the page
      const isAtBottom = parentScrollTop + parentWindowHeight >= parentScrollHeight - 50;

      // If at bottom, highlight the last heading
      if (isAtBottom) {
        const lastHeading = headings[headings.length - 1];
        const id = lastHeading?.id;
        if (id && id !== currentActiveIdRef.current) {
          currentActiveIdRef.current = id;
          sendMessage({ type: 'heading-visible', payload: id });
        }
        return;
      }

      // Simple logic: Find heading closest to top of viewport (around 100px mark)
      let activeHeading: Element | null = null;
      let smallestDistance = Infinity;

      for (const heading of Array.from(headings)) {
        const rect = heading.getBoundingClientRect();
        const headingTopInParent = iframeRect.top + rect.top;
        
        // Skip headings that are below viewport
        if (headingTopInParent > parentWindowHeight) {
          break;
        }
        
        // Calculate distance from sweet spot (100px from top)
        const distance = Math.abs(headingTopInParent - 100);
        
        // Only consider headings that are visible or recently passed
        if (headingTopInParent >= -200 && headingTopInParent <= parentWindowHeight) {
          if (distance < smallestDistance) {
            smallestDistance = distance;
            activeHeading = heading;
          }
          
          // If heading is in the ideal zone (0-150px), prioritize it
          if (headingTopInParent >= 0 && headingTopInParent <= 150) {
            activeHeading = heading;
            break;
          }
        }
      }

      // Fallback: if no heading found, use the first visible one
      if (!activeHeading) {
        for (const heading of Array.from(headings)) {
          const rect = heading.getBoundingClientRect();
          const headingTopInParent = iframeRect.top + rect.top;
          
          if (headingTopInParent >= 0 && headingTopInParent <= parentWindowHeight) {
            activeHeading = heading;
            break;
          }
        }
      }

      const id = activeHeading?.id;
      if (id && id !== currentActiveIdRef.current) {
        currentActiveIdRef.current = id;
        sendMessage({ type: 'heading-visible', payload: id });
      }
    };

    // Initial check
    setTimeout(updateActiveHeading, 200);

    // Use requestAnimationFrame for smooth performance
    const handleParentScroll = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      rafIdRef.current = requestAnimationFrame(() => {
        updateActiveHeading();
        rafIdRef.current = null;
      });
    };

    // Listen to scroll events on PARENT window
    window.parent.addEventListener('scroll', handleParentScroll, { passive: true });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      window.parent.removeEventListener('scroll', handleParentScroll);
    };
  }, [content, contentRef, sendMessage]);
};
