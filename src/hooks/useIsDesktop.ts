import { useEffect, useState } from "react";

export function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= breakpoint
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);

  return isDesktop;
}
