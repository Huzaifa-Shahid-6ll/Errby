"use client";

import { useRef } from "react";
import Link from "next/link";
import { ListIcon } from "@phosphor-icons/react/dist/csr/List";
import styles from "./landing-page.module.css";

export function LandingMenu() {
  const menu = useRef<HTMLDetailsElement>(null);
  return (
    <details
      className={styles.mobileMenu}
      ref={menu}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current?.open) {
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary>
        <ListIcon size={20} weight="bold" aria-hidden="true" /> Menu
      </summary>
      <nav
        aria-label="Mobile navigation"
        onClick={(event) => {
          const link = (event.target as HTMLElement).closest("a");
          if (!link || !menu.current) return;
          menu.current.open = false;
          const target = document.getElementById(link.hash.slice(1));
          target?.setAttribute("tabindex", "-1");
          target?.focus({ preventScroll: true });
        }}
      >
        <a href="#how-it-works">How it works</a>
        <a href="#for-teachers">For teachers</a>
        <a href="#questions">Questions</a>
        <a href="#example">See an example</a>
        <Link href="/sign-in">Sign in</Link>
        <Link href="/sign-up">Sign up</Link>
      </nav>
    </details>
  );
}
