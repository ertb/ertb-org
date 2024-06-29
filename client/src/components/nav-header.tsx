import { UseScrollPosition } from "@/hooks/use-scroll-position"
import { cn } from "@/lib/utils"
import { HamburgerMenuIcon } from "@radix-ui/react-icons"
import { ReactNode, useRef, useState } from "react"
import { NavLink } from "react-router-dom"
import { Link, animateScroll as scroll } from "react-scroll"
import { useOnClickOutside } from "usehooks-ts"
import { Button } from "./ui/button"
import { useOnScreen } from "@/hooks/use-on-screen"

interface Props {
  links?: {[key:string]:string}
  title?: string
  hero?: boolean
  logout?: ()=>void
  children?: ReactNode
}
export const NavHeader = ({links, title, hero, logout, children}:Props) => {
  title = links ? undefined : title
  let atTop = (UseScrollPosition() <= 100)
  atTop = (!hero || title) ? false : atTop
  const currentSection = useOnScreen('section', 32)
  const [showMenu, _setShowMenu] = useState(false)
  const [menuHidden, _setMenuHidden] = useState(true)
  const setShowMenu = (showMenu:boolean)=>{
    if (!showMenu) {
      _setShowMenu(false)
      setTimeout(()=>_setMenuHidden(true),500)
    } else {
      _setMenuHidden(false)
      setTimeout(()=>_setShowMenu(true),1)
    }
  }
  const ref = useRef(null)
  useOnClickOutside(ref, ()=>setShowMenu(false))

  return (<header>
    <div className={cn("fixed z-10 w-full flex gap-4 justify-between items-center px-8 md:px-12 py-6", atTop ? 'bg-[#ffffffcc]' :  'bg-white drop-shadow-md')}>
      <NavLink className="shrink-0 -m-1" to="/" onClick={()=>scroll.scrollToTop()}>
        <img alt="Electronic Recording Technology Board" src="/img/ertb-logo.svg" className={cn('p-1 transition-all', atTop ? 'h-20 lg:h-28' : 'h-14')}/>
      </NavLink>
      {title ? <span className="title">{title}</span> : undefined}
      {links ? <nav className='text-[#1f6998] text-right' ref={ref}>
        <button name="main-menu" className="md:hidden my-4" onClick={()=>setShowMenu(!showMenu)}>
          <HamburgerMenuIcon/>
        </button>
        <ul className={cn("md:flex md:p-0 md:flex-wrap items-center justify-end duration-500 ease-in-out space-y-4 md:space-y-0 text-right md:gap-x-4 md:pt-0 md:h-auto overflow-hidden m-[-6px] p-[6px] md:overflow-visible visible", showMenu ? 'h-60' : 'h-0', menuHidden && 'hidden md:visible')}>
          {Object.entries(links).map(([label,id])=>{
            if (id.startsWith('/')) {
              return <li key={label}><NavLink className="cursor-pointer" to={id} onClick={()=>setShowMenu(false)}>{label}</NavLink></li>
            } else {
              return <li key={label}><Link href={`#${id}`} offset={-104} smooth className={cn("cursor-pointer", {active: currentSection == id})} to={id} onClick={()=>setShowMenu(false)}>{label}</Link></li>
            }
          })}
          <li>{logout ? <Button className='text-xs' onClick={logout}>Logout</Button> : undefined}</li>
        </ul>
      </nav> : undefined }
    </div>
    <div className="min-h-24">{children}</div>
  </header>)
}