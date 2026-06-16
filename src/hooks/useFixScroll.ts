// src/hooks/useFixScroll.ts

import { useEffect } from "react";

export function useFixScroll() {
  useEffect(() => {
    // Doar asigură că scroll-ul este activ
    // Nu suprascrie nimic
    return () => {};
  }, []);
}
