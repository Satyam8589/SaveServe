import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      setIsMobile(false)
      return
    }
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange)
    } else if (mql.addListener) {
      mql.addListener(onChange)
    }
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange)
      } else if (mql.removeListener) {
        mql.removeListener(onChange)
      }
    };
  }, [])

  return !!isMobile
}
