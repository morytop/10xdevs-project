import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./Logo";

/**
 * Public navigation for unauthenticated users
 * Features:
 * - Sticky position with blur backdrop
 * - Desktop: Full navigation with anchor links
 * - Mobile: Hamburger menu
 * - Auth buttons (Login, Register)
 */
export function PublicNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationLinks = [
    { href: "#benefits", label: "Korzyści" },
    { href: "#how-it-works", label: "Jak to działa" },
  ];

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // Focus on heading for accessibility
      const heading = target.querySelector("h2");
      if (heading) {
        // Make heading focusable temporarily
        heading.setAttribute("tabindex", "-1");
        heading.focus();
        // Remove tabindex after focus to maintain natural tab order
        heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
      }
    }
  };

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-label="Główna nawigacja"
    >
      <div className="container flex h-16 items-center justify-between">
        <Logo />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href.slice(1))}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Auth Buttons - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" className="min-h-[44px] min-w-[44px]" asChild>
            <a href="/login">Zaloguj się</a>
          </Button>
          <Button className="min-h-[44px] min-w-[44px]" asChild>
            <a href="/register">Zarejestruj się</a>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Otwórz menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav id="mobile-menu" className="flex flex-col gap-4 mt-8" aria-label="Menu mobilne">
                {navigationLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleAnchorClick(e, link.href.slice(1))}
                    className="text-lg font-medium text-foreground hover:text-muted-foreground transition-colors py-2 min-h-[44px] flex items-center"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                  <Button variant="ghost" asChild className="w-full min-h-[44px]">
                    <a href="/login">Zaloguj się</a>
                  </Button>
                  <Button asChild className="w-full min-h-[44px]">
                    <a href="/register">Zarejestruj się</a>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
