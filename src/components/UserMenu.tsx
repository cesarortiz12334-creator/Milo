"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { UserRole } from "@/types";

type Item = { href: string; label: string };

// Opciones del menú según el rol (la primera apunta a la sección principal del rol).
const OPCIONES: Record<UserRole, Item[]> = {
  solicitante: [
    { href: "/mis-campanas", label: "Mis campañas" },
    { href: "/perfil", label: "Mi perfil" },
  ],
  donante: [
    { href: "/perfil", label: "Mis donaciones" },
    { href: "/perfil", label: "Mi perfil" },
  ],
  veterinaria: [
    { href: "/veterinaria", label: "Mi panel" },
    { href: "/perfil", label: "Mi perfil" },
  ],
};

export default function UserMenu({
  nombre,
  email,
  role,
}: {
  nombre: string | null;
  email: string | null;
  role: UserRole | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const items = role ? OPCIONES[role] : [{ href: "/perfil", label: "Mi perfil" }];
  const display = nombre || email || "Mi cuenta";
  const inicial = (display.trim()[0] || "M").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-semibold text-dark transition hover:bg-primary-soft/40"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-white">
          {inicial}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{display}</span>
        <span aria-hidden="true" className="text-xs text-muted">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-black/5 bg-white py-1 shadow-lg ring-1 ring-black/5"
        >
          <div className="border-b border-black/5 px-4 py-3">
            <p className="truncate font-heading text-sm font-bold text-dark">
              {display}
            </p>
            {email && <p className="truncate text-xs text-muted">{email}</p>}
          </div>

          {items.map((it, i) => (
            <Link
              key={`${it.href}-${i}`}
              href={it.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-primary-soft/40"
            >
              {it.label}
            </Link>
          ))}

          <form action="/auth/signout" method="post" className="border-t border-black/5">
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
