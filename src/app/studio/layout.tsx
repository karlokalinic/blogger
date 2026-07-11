import { StudioShell } from "@/components/studio/studio-shell";
import { isStudioAuthenticated, studioProtectionEnabled } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  if (studioProtectionEnabled() && !(await isStudioAuthenticated())) redirect("/studio-login");
  return <StudioShell>{children}</StudioShell>;
}
