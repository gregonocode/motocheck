"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaUserAlt } from "react-icons/fa";
import { CgSearchFound } from "react-icons/cg";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { LuArrowDownUp } from "react-icons/lu";

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
    icon: <LuArrowDownUp size={20} />,
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

export function SidebarNavigation() {
  return (
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
  );
}

export function BottomNavigation() {
  return (
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
  );
}
