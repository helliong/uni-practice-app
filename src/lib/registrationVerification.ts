import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_VERIFICATION_ATTEMPTS = 5;

export function createVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashVerificationCode(email: string, code: string) {
  return bcrypt.hash(`${email}:${code}`, 10);
}

export function isVerificationCodeValid(email: string, code: string, expectedHash: string) {
  return bcrypt.compare(`${email}:${code}`, expectedHash);
}
