import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_VERIFICATION_ATTEMPTS = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeRegistrationEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isRegistrationInputValid(name: string, email: string, password: string) {
  return Boolean(name.trim() && EMAIL_PATTERN.test(email) && password.length >= 8);
}

export function isSixDigitVerificationCode(code: string) {
  return /^\d{6}$/.test(code);
}

export function getVerificationAvailability(
  verification: { expiresAt: Date; attempts: number } | null | undefined,
  now = new Date(),
) {
  if (!verification || verification.expiresAt <= now) return "EXPIRED" as const;
  if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) return "ATTEMPTS_EXCEEDED" as const;
  return "AVAILABLE" as const;
}

export function getEmailDomain(email: string) {
  return email.split("@")[1] || null;
}

export function createVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashVerificationCode(email: string, code: string) {
  return bcrypt.hash(`${email}:${code}`, 10);
}

export function isVerificationCodeValid(email: string, code: string, expectedHash: string) {
  return bcrypt.compare(`${email}:${code}`, expectedHash);
}
