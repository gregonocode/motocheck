import { CgSearchFound } from "react-icons/cg";
import { BottomNavigation, SidebarNavigation } from "./DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F8F8F8] text-[#181818]">
      <div className="flex min-h-screen w-full">
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
            <SidebarNavigation />
          </nav>
        </aside>

        <section className="min-w-0 flex-1 pb-24 xl:pb-0">{children}</section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(0,0,0,0.08)] backdrop-blur-xl xl:hidden">
        <BottomNavigation />
      </nav>
    </main>
  );
}
