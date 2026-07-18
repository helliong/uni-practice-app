import assert from "node:assert/strict";
import test from "node:test";
import {
  createVerificationCode,
  hashVerificationCode,
  isVerificationCodeValid,
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
