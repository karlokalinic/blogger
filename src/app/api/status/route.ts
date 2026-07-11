import { databaseConfigured } from "@/lib/db";
import { studioProtectionEnabled } from "@/lib/auth";

export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    status: "operational",
    build: "0.4.7",
    database: databaseConfigured(),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    studioProtected: studioProtectionEnabled(),
    localVault: true,
    analysis: "rule-based-local-request",
  });
}
