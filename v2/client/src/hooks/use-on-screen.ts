import { useEffect, useState } from 'react'

/**
 * 
 * @param selectors A comma separated list of CSS selectors to match against. Default is 'section'.
 * @returns id of current 
 */
export const useOnScreen = (selectors='section', offset=0) => {
  const [current, setCurrent] = useState('')

  useEffect(() => {
    function handleScroll() {
      const elements = document.querySelectorAll(selectors)
      elements.forEach((element) => {
        if (element instanceof HTMLElement) {
          const top = element.offsetTop - offset
          const height = element.clientHeight
          if (scrollY >= (top - height / 3)) {
            setCurrent(element.getAttribute('id') ?? '')
        }
       }
      })
    }
    
    window.addEventListener('scroll', handleScroll)
    
    handleScroll()
    
    // Remove the listener as soon as the component is unmounted
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollY])
  
  return current
}