"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { FaCamera, FaUserAlt } from "react-icons/fa";
import { CgSearchFound } from "react-icons/cg";

const navItems = [
  {
    href: "/dashboard",
    icon: <CgSearchFound size={21} />,
    label: "Início",
    desktopLabel: "Dashboard",
  },
  {
    href: "/dashboard/atendimentos",
    icon: <HiOutlineClipboardDocumentList size={22} />,
    label: "Atend.",
    desktopLabel: "Atendimentos",
  },
  {
    href: "/dashboard/entradas-saidas",
    icon: <FaCamera size={18} />,
    label: "Entrada",
    desktopLabel: "Entradas e saídas",
  },
  {
    href: "/dashboard/clientes",
    icon: <FaUserAlt size={17} />,
    label: "Clientes",
    desktopLabel: "Clientes",
  },
  {
    href: "/dashboard/perfil",
    icon: <HiOutlineUserCircle size={22} />,
    label: "Perfil",
    desktopLabel: "Perfil",
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

function SidebarNavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm transition ${
        active
          ? "bg-yellow-200 font-extrabold text-[#181818]"
          : "font-bold text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
      {label}
    </Link>
  );
}

function BottomNavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition ${
        active
          ? "bg-[#181818] text-yellow-200 shadow-sm"
          : "text-zinc-500 hover:bg-zinc-100"
      }`}
    >
      <span className="flex h-6 items-center justify-center">{icon}</span>
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F8F8F8] text-[#181818]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-72 flex-col border-r border-zinc-200 bg-white xl:flex">
          <div className="border-b border-zinc-200 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#181818] text-yellow-200">
                <CgSearchFound size={24} />
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-zinc-500">
                  Sistema
                </p>
                <h2 className="text-2xl font-black">MotoCheck</h2>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navItems.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.desktopLabel}
                />
              ))}
            </div>
          </nav>
        </aside>

        <section className="min-w-0 flex-1 pb-24 xl:pb-0">{children}</section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(0,0,0,0.08)] backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2">
          {navItems.map((item) => (
            <BottomNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>
      </nav>
    </main>
  );
}
