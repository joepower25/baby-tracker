import { createHash, randomBytes } from "node:crypto";

export function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}

export function hashInviteCode(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}
