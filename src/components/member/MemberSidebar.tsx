"use client";

import { useEffect, useState } from "react";
import { MemberNav } from "@/components/member/MemberNav";
import { NavIconChevronLeft, NavIconChevronRight } from "@/components/member/MemberNavIcons";

const STORAGE_KEY = "cm-member-sidebar-collapsed";

export function MemberSidebar({ showAdmin }: { showAdmin: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed, ready]);

  return (
    <aside
      className={`hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out lg:block ${
        collapsed ? "w-[4.25rem]" : "w-60"
      } ${ready ? "" : ""}`}
      aria-label="Menu lateral da área logada"
    >
      <div className="sticky top-[calc(3.75rem+2rem)] md:top-[calc(4.25rem+2rem)]">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-controls="member-sidebar-nav"
          className="mb-3 flex w-full min-h-11 items-center gap-2 rounded-md border border-cm-divider px-2.5 py-2 text-sm font-medium text-cm-gray transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
        >
          {collapsed ? (
            <>
              <NavIconChevronRight className="mx-auto h-5 w-5 shrink-0" />
              <span className="sr-only">Expandir menu</span>
            </>
          ) : (
            <>
              <NavIconChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
              <span>Recolher menu</span>
            </>
          )}
        </button>
        {!collapsed && (
          <p className="font-display mb-3 px-1 text-[10px] tracking-[0.35em] text-cm-gray">Área logada</p>
        )}
        <div id="member-sidebar-nav">
          <MemberNav layout="sidebar" showAdmin={showAdmin} collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
