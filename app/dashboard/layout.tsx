"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { FaCamera, FaUserAlt } from "react-icons/fa";
import { CgSearchFound } from "react-icons/cg";

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm transition ${
        active
          ? "bg-yellow-200 font-extrabold text-[#181818]"
          : "font-bold text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {icon}
      {label}
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
              <NavItem
                href="/dashboard"
                icon={<CgSearchFound />}
                label="Dashboard"
              />

              <NavItem
                href="/dashboard/atendimentos"
                icon={<HiOutlineClipboardDocumentList size={20} />}
                label="Atendimentos"
              />

              <NavItem
                href="/dashboard/entradas-saidas"
                icon={<FaCamera />}
                label="Entradas e saídas"
              />

              <NavItem
                href="/dashboard/clientes"
                icon={<FaUserAlt />}
                label="Clientes"
              />
            </div>
          </nav>
        </aside>

        <section className="flex-1">{children}</section>
      </div>
    </main>
  );
}