"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "upa-os:sidebar-collapsed";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

// Desktop-only collapse preference for the shared sidebar, persisted
// via localStorage so it survives navigation and reloads — plain
// React context + storage, no new state library. Only affects the
// `lg`+ width; the `md` icon-rail and <`md` drawer (MobileNav) are
// unrelated responsive behaviour and stay as-is.
export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Reading localStorage must happen post-mount (unavailable during
    // SSR) — initialising state from it directly would desync from
    // the server-rendered markup and trigger a hydration mismatch.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebarState must be used within SidebarStateProvider");
  }
  return ctx;
}
