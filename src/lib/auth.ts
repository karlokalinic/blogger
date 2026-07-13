import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "veo_studio_session";

export function studioProtectionEnabled() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.STUDIO_PASSWORD);
}

function sessionValue() {
  const secret = process.env.AUTH_SECRET || process.env.STUDIO_PASSWORD || "local-preview-only";
  return createHmac("sha256", secret).update("veo-zavod-owner-session-v1").digest("hex");
}

export async function isStudioAuthenticated() {
  if (!studioProtectionEnabled()) return true;
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const expected = sessionValue();
  if (value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export function verifyPasscode(candidate: string) {
  const expected = process.env.STUDIO_PASSWORD;
  if (!expected || candidate.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}

export async function createStudioSession() {
  (await cookies()).set(COOKIE_NAME, sessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroyStudioSession() {
  (await cookies()).delete(COOKIE_NAME);
}
