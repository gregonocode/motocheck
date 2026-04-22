"use client";

import { useState } from "react";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCog,
} from "react-icons/hi2";
import {
  FaCamera,
  FaUserAlt,
} from "react-icons/fa";
import { CgSearchFound } from "react-icons/cg";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#F8F8F8] text-[#181818]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        {/* Sidebar */}
        <aside className="hidden w-72 flex-col border-r border-zinc-200 bg-white xl:flex">
          <div className="border-b border-zinc-200 p-6">
            <div className="flex items-center justify-between">
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
          </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <button className="flex w-full items-center gap-3 rounded-2xl bg-yellow-200 px-4 py-4 text-left text-sm font-extrabold text-[#181818]">
                <CgSearchFound />
                Dashboard
              </button>

              <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-bold text-zinc-600 transition hover:bg-zinc-100">
                <HiOutlineClipboardDocumentList size={20} />
                Checklists
              </button>

              <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-bold text-zinc-600 transition hover:bg-zinc-100">
                <FaCamera />
                Entradas e saídas
              </button>

              <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left text-sm font-bold text-zinc-600 transition hover:bg-zinc-100">
                <FaUserAlt />
                Clientes
              </button>
            </div>
          </nav>
        </aside>

        {/* Conteúdo */}
        <section className="flex-1">
          {children}
        </section>
      </div>
    </main>
  );
}