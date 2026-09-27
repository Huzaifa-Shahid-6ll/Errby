"use client";
import { useEffect } from "react";

export function useActivity(id: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let lastInput = Date.now();
    let previous = Date.now();
    let visible = document.visibilityState === "visible";
    const active = () => {
      lastInput = Date.now();
    };
    const visibility = () => {
      visible = document.visibilityState === "visible";
      previous = Date.now();
    };
    const send = (milliseconds: number) => {
      void fetch(`/api/sessions/${id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: crypto.randomUUID(), milliseconds }),
      }).catch(() => {});
    };
    send(0);
    const timer = setInterval(() => {
      const now = Date.now();
      if (visible && now - lastInput <= 60000)
        send(Math.min(15000, now - previous));
      previous = now;
    }, 15000);
    for (const event of ["keydown", "pointerdown", "scroll"])
      window.addEventListener(event, active, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(timer);
      for (const event of ["keydown", "pointerdown", "scroll"])
        window.removeEventListener(event, active);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [id, enabled]);
}
