"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  function syncStorage(event: StorageEvent) {
    if (event.key === "errby-theme" || event.key === null) {
      applyTheme(event.newValue === "dark");
    }
  }
  window.addEventListener("storage", syncStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", syncStorage);
  };
}

export function useAppTheme() {
  return useSyncExternalStore(subscribe, isDark, () => false)
    ? "dark"
    : "light";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useAppTheme() === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`landing-theme-toggle min-h-11 min-w-11 text-foreground ${className}`}
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      onClick={() => {
        const nextDark = !isDark();
        applyTheme(nextDark);
        try {
          localStorage.setItem("errby-theme", nextDark ? "dark" : "light");
        } catch {
          // The selected theme still works when browser storage is unavailable.
        }
      }}
    >
      <Moon className="dark:hidden" aria-hidden="true" />
      <Sun className="hidden dark:block" aria-hidden="true" />
    </Button>
  );
}
