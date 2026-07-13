import { auth } from "@/auth";
import { TechHeader } from "@/components/tech/tech-header";
import { TechBottomNav } from "@/components/tech/tech-bottom-nav";

export default async function TechLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-muted/20">
      <TechHeader userName={session?.user?.name ?? "Teknisyen"} />
      <main className="flex-1 px-4 pt-4 pb-24">{children}</main>
      <TechBottomNav />
    </div>
  );
}
