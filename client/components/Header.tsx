'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from './Button'

const Header = () => {
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
      <div
        className={`flex items-center justify-between gap-6 rounded-full border border-foreground/10 bg-background/70 backdrop-blur-md transition-all duration-300 ${
          scrolled ? 'w-full max-w-2xl px-4 py-2' : 'w-full max-w-4xl px-6 py-3'
        }`}
      >
        <span className="font-semibold text-lg">Payflow</span>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#" className="hover:text-primary transition-colors">
            Product
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Pricing
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            About
          </a>
        </nav>

        <Button variant='primary' onClick={() => router.push('/login')}>
          Get Started
        </Button>
      </div>
    </header>
  )
}

export default Header
