import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendRegistrationCode } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getClientIp } from "@/lib/rateLimit";
import {
  createVerificationCode,
  hashVerificationCode,
  VERIFICATION_CODE_TTL_MS,
} from "@/lib/registrationVerification";

const REGISTER_RATE_LIMIT = {
  limit: 5,
  windowMs: 60 * 60 * 1000,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const clientIp = getClientIp(req);
    const rateLimit = consumeRateLimit(
      `register:${clientIp}:${email || "unknown"}`,
      REGISTER_RATE_LIMIT,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Слишком много запросов кода. Попробуйте позже." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter) },
        },
      );
    }

    if (!name || !EMAIL_PATTERN.test(email) || password.length < 8) {
      return NextResponse.json(
        { message: "Проверьте имя, email и пароль (минимум 8 символов)." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { message: "Пользователь с таким email уже существует." },
        { status: 409 },
      );
    }

    const code = createVerificationCode();
    const [passwordHash, codeHash] = await Promise.all([
      bcrypt.hash(password, 10),
      hashVerificationCode(email, code),
    ]);

    await prisma.registrationVerification.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        codeHash,
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
        attempts: 0,
      },
      create: {
        name,
        email,
        passwordHash,
        codeHash,
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
      },
    });

    await sendRegistrationCode(email, code);

    return NextResponse.json(
      { message: "Код подтверждения отправлен на почту.", email },
      { status: 202 },
    );
  } catch (error) {
    console.error("Failed to start registration:", error);
    return NextResponse.json(
      { message: "Не удалось отправить код подтверждения. Попробуйте позже." },
      { status: 500 },
    );
  }
}
