// src/hooks/useScrollRestore.ts

import { useRef, useCallback } from "react";

export function useScrollRestore() {
  const scrollPositionRef = useRef<number>(0);
  const isRestoringRef = useRef<boolean>(false);

  const saveScrollPosition = useCallback(() => {
    scrollPositionRef.current = window.scrollY || window.pageYOffset || 0;
  }, []);

  const restoreScrollPosition = useCallback((delay: number = 200) => {
    // Previne multiple restaurări simultane
    if (isRestoringRef.current) return;
    isRestoringRef.current = true;

    const targetPosition = scrollPositionRef.current;
    
    // Folosește requestAnimationFrame pentru performanță mai bună
    const doRestore = () => {
      try {
        window.scrollTo({
          top: targetPosition,
          behavior: 'instant'
        });
        
        // Verifică dacă scroll-ul a fost aplicat corect
        setTimeout(() => {
          const currentScroll = window.scrollY || window.pageYOffset || 0;
          if (Math.abs(currentScroll - targetPosition) > 10) {
            window.scrollTo({
              top: targetPosition,
              behavior: 'instant'
            });
          }
          isRestoringRef.current = false;
        }, 50);
      } catch (err) {
        // Fallback pentru browsere vechi
        window.scrollTo(0, targetPosition);
        isRestoringRef.current = false;
      }
    };

    if (delay > 0) {
      setTimeout(doRestore, delay);
    } else {
      requestAnimationFrame(doRestore);
    }
  }, []);

  return { saveScrollPosition, restoreScrollPosition };
}
