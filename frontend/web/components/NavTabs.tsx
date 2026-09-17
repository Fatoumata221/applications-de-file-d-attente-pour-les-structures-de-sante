"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/centres", label: "Centres" },
  { href: "/rendez-vous", label: "Prendre RDV" },
  { href: "/file-attente", label: "File d'attente" },
  { href: "/historique", label: "Historique" },
  { href: "/profil", label: "Profil" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-2xl overflow-x-auto px-4 py-3">
        <div className="flex w-max gap-1 rounded-full bg-surface-alt p-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
