import { NavBar } from "./NavBar";
import { AppFooter } from "./AppFooter";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavBar />
      <main className="pt-16 py-6 flex-1">
        <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1536px] px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
