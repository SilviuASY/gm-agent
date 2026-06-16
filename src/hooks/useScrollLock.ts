// src/hooks/useScrollLock.ts

import { useEffect } from "react";

export function useScrollLock(shouldLock: boolean = false) {
  useEffect(() => {
    // Nu face nimic dacă valoarea nu s-a schimbat
    return () => {};
  }, [shouldLock]);
  
  // Hook-ul nu mai blochează nimic - scroll-ul este mereu liber
  return;
}
