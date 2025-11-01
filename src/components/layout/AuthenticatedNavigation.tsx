import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./Logo";

interface AuthenticatedNavigationProps {
  /** Aktualny pathname dla highlightowania aktywnej strony */
  currentPath?: string;
}

/**
 * Authenticated navigation for logged-in users
 * Features:
 * - Sticky position with blur backdrop
 * - Desktop: Full navigation with Dashboard and Profile links
 * - Mobile: Hamburger menu
 * - Logout button
 */
export function AuthenticatedNavigation({ currentPath = "" }: AuthenticatedNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Mój Profil" },
  ];

  const handleLogout = async () => {
    try {
      // Wywołaj endpoint logout
      await fetch("/api/auth/logout", { method: "POST" });
      // Redirect na stronę główną
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: wyczyść localStorage i redirect
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const isActive = (href: string) => {
    return currentPath === href;
  };

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-label="Nawigacja aplikacji"
    >
      <div className="container flex h-16 items-center justify-between">
        <Logo />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                isActive(link.href)
                  ? "text-foreground font-bold border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Logout Button - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" onClick={handleLogout} className="min-h-[44px] min-w-[44px]">
            Wyloguj
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
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`text-lg font-medium transition-colors py-2 min-h-[44px] flex items-center ${
                      isActive(link.href) ? "text-foreground font-bold" : "text-foreground hover:text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                  <Button variant="ghost" onClick={handleLogout} className="w-full min-h-[44px]">
                    Wyloguj
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
