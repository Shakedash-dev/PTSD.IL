import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // undefined (not false) so consumers can distinguish "not yet measured" from "desktop".
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    // MOBILE_BREAKPOINT - 1 = 767px so the query matches Tailwind's `md` exactly (< 768px).
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange);
  }, [])

  // !! coerces undefined → false on first render before the effect fires.
  return !!isMobile
}
