'use client';

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { MenuIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-[#FFFFFF] dark:bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-6 md:px-8 justify-between">
        {/* Desktop Logo and Nav */}
        <div className="hidden md:flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="/images/mascot/Winky the TREX.png"
              alt="Storywink Mascot"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="hidden font-bold text-3xl sm:inline-block text-slate-900 dark:text-white">
              Storywin<span className="text-[#F76C5E]" >k.ai</span>
            </span>
          </Link>
          {/* <nav className="flex items-center space-x-6 text-sm font-medium">
             <Link href="/gallery" className="text-foreground/60 transition-colors hover:text-foreground/80">Gallery</Link>
             <Link href="/pricing" className="text-foreground/60 transition-colors hover:text-foreground/80">Pricing</Link>
             {/* Add other links as needed */}
          {/* </nav> */}
        </div>

        {/* Mobile Logo */}
        <div className="flex items-center md:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/mascot/Winky the TREX.png"
              alt="Storywink Mascot"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-bold text-2xl sm:inline-block text-slate-900 dark:text-white">
              Storywin<span className="text-[#F76C5E]">k.ai</span>
            </span>
          </Link>
        </div>
        
        {/* Right side content (Auth buttons and Mobile Menu Trigger) */}
        <div className="flex items-center space-x-2">
          {/* Auth buttons - visible on desktop screens */}
          <nav className="hidden md:flex items-center space-x-2">
             <SignedOut>
                <Button asChild variant="ghost">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
             </SignedOut>
             <SignedIn>
                 <Button asChild variant="secondary" size="sm">
                    <Link 
                      href="/library" 
                      className="text-slate-900 dark:text-white transition-colors hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      My Library
                    </Link>
                 </Button>
                 <UserButton afterSignOutUrl="/" />
             </SignedIn>
          </nav>

          {/* Mobile Menu Trigger - only on small screens */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              ref={menuButtonRef}
            >
              <MenuIcon className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile Menu (dropdown) */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="absolute top-14 left-0 right-0 z-40 bg-white dark:bg-background shadow-md md:hidden"
        >
          <nav className="container flex flex-col space-y-2 p-4">
            <SignedIn>
              <Link
                href="/library"
                className="text-slate-900 dark:text-white transition-colors hover:text-slate-700 dark:hover:text-slate-300 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Library
              </Link>
              <div className="py-2">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <Button asChild variant="ghost" onClick={() => setIsMobileMenuOpen(false)}>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild onClick={() => setIsMobileMenuOpen(false)}>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </SignedOut>
          </nav>
        </div>
      )}
    </header>
  );
} 