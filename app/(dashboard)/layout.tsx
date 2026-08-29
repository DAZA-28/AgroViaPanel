import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/server";
import { getStaffForUser } from "@/lib/staff";
import { Nav } from "@/components/Nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login.html");

  const staff = await getStaffForUser(supabase, user.id);
  if (!staff || !staff.activo) redirect("/login.html");

  return (
    <div className="app-shell">
      <Nav rol={staff.rol} />
      <main className="app-main">{children}</main>
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
