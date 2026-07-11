import { createStudioSession, destroyStudioSession, studioProtectionEnabled, verifyPasscode } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({ passcode: z.string().min(1).max(256) });

export async function POST(request: Request) {
  if (!studioProtectionEnabled()) return Response.json({ ok: true, mode: "preview" });
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !verifyPasscode(parsed.data.passcode)) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return Response.json({ error: "The signal did not recognize that passcode." }, { status: 401 });
  }
  await createStudioSession();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await destroyStudioSession();
  return Response.json({ ok: true });
}
