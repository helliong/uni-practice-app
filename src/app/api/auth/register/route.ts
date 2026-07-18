import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sendRegistrationCode } from "@/lib/auth/mailer";
import { prisma } from "@/lib/database/prisma";
import { consumeRateLimit, getClientIp } from "@/lib/auth/rateLimit";
import {
  createVerificationCode,
  hashVerificationCode,
  isRegistrationInputValid,
  normalizeRegistrationEmail,
  VERIFICATION_CODE_TTL_MS,
} from "@/lib/auth/registrationVerification";

const REGISTER_RATE_LIMIT = {
  limit: 5,
  windowMs: 60 * 60 * 1000,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = normalizeRegistrationEmail(body.email);
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

    if (!isRegistrationInputValid(name, email, password)) {
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
