import assert from "node:assert/strict";
import test from "node:test";
import {
  createVerificationCode,
  getEmailDomain,
  getVerificationAvailability,
  hashVerificationCode,
  isRegistrationInputValid,
  isSixDigitVerificationCode,
  isVerificationCodeValid,
  MAX_VERIFICATION_ATTEMPTS,
  normalizeRegistrationEmail,
} from "./registrationVerification";

test("createVerificationCode returns exactly six digits", () => {
  for (let index = 0; index < 100; index += 1) {
    assert.match(createVerificationCode(), /^\d{6}$/);
  }
});

test("verification code hash is bound to email and code", async () => {
  const email = "student@example.com";
  const hash = await hashVerificationCode(email, "123456");

  assert.equal(await isVerificationCodeValid(email, "123456", hash), true);
  assert.equal(await isVerificationCodeValid(email, "654321", hash), false);
  assert.equal(
    await isVerificationCodeValid("other@example.com", "123456", hash),
    false,
  );
});

test("registration input normalizes email and validates required fields", () => {
  assert.equal(normalizeRegistrationEmail("  Student@Example.COM "), "student@example.com");
  assert.equal(normalizeRegistrationEmail(null), "");
  assert.equal(isRegistrationInputValid("Студент", "student@example.com", "password"), true);
  assert.equal(isRegistrationInputValid("", "student@example.com", "password"), false);
  assert.equal(isRegistrationInputValid("Студент", "invalid", "password"), false);
  assert.equal(isRegistrationInputValid("Студент", "student@example.com", "short"), false);
});

test("verification code format accepts exactly six digits", () => {
  assert.equal(isSixDigitVerificationCode("123456"), true);
  assert.equal(isSixDigitVerificationCode("12345"), false);
  assert.equal(isSixDigitVerificationCode("12345a"), false);
});

test("verification availability detects expiration and exceeded attempts", () => {
  const now = new Date("2026-07-18T12:00:00Z");
  assert.equal(getVerificationAvailability(null, now), "EXPIRED");
  assert.equal(getVerificationAvailability({
    expiresAt: new Date("2026-07-18T11:59:59Z"),
    attempts: 0,
  }, now), "EXPIRED");
  assert.equal(getVerificationAvailability({
    expiresAt: new Date("2026-07-18T12:10:00Z"),
    attempts: MAX_VERIFICATION_ATTEMPTS,
  }, now), "ATTEMPTS_EXCEEDED");
  assert.equal(getVerificationAvailability({
    expiresAt: new Date("2026-07-18T12:10:00Z"),
    attempts: MAX_VERIFICATION_ATTEMPTS - 1,
  }, now), "AVAILABLE");
});

test("email domain is extracted safely", () => {
  assert.equal(getEmailDomain("student@example.com"), "example.com");
  assert.equal(getEmailDomain("invalid"), null);
});
