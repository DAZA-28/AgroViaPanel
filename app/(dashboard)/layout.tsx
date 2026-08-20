import { redirect } from "next/navigation";
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
    <div style={{ display: "flex" }}>
      <Nav rol={staff.rol} />
      <main style={{ flex: 1, padding: 32 }}>{children}</main>
    </div>
  );
}
