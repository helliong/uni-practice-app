import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { consumeRateLimit, getClientIp } from "@/lib/auth/rateLimit";
import {
  getEmailDomain,
  getVerificationAvailability,
  isVerificationCodeValid,
  isSixDigitVerificationCode,
  normalizeRegistrationEmail,
} from "@/lib/auth/registrationVerification";

const VERIFY_RATE_LIMIT = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeRegistrationEmail(body.email);
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const rateLimit = consumeRateLimit(
      `register-verify:${getClientIp(req)}:${email || "unknown"}`,
      VERIFY_RATE_LIMIT,
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: "Слишком много попыток. Попробуйте позже." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
      );
    }

    if (!email || !isSixDigitVerificationCode(code)) {
      return NextResponse.json(
        { message: "Введите шестизначный код." },
        { status: 400 },
      );
    }

    const verification = await prisma.registrationVerification.findUnique({
      where: { email },
    });

    const verificationAvailability = getVerificationAvailability(verification);

    if (!verification || verificationAvailability === "EXPIRED") {
      return NextResponse.json(
        { message: "Код истёк. Запросите новый код." },
        { status: 410 },
      );
    }

    if (verificationAvailability === "ATTEMPTS_EXCEEDED") {
      return NextResponse.json(
        { message: "Превышено число попыток. Запросите новый код." },
        { status: 429 },
      );
    }

    if (!(await isVerificationCodeValid(email, code, verification.codeHash))) {
      await prisma.registrationVerification.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json(
        { message: "Неверный код подтверждения." },
        { status: 400 },
      );
    }

    const emailDomain = getEmailDomain(email);
    const university = emailDomain
      ? await prisma.university.findFirst({
          where: { emailDomains: { has: emailDomain } },
          select: { id: true },
        })
      : null;

    const user = await prisma.$transaction(async (transaction) => {
      const existingUser = await transaction.user.findUnique({ where: { email } });

      if (existingUser) {
        await transaction.registrationVerification.deleteMany({ where: { email } });
        return existingUser;
      }

      const createdUser = await transaction.user.create({
        data: {
          name: verification.name,
          email,
          password: verification.passwordHash,
          role: university ? Role.STUDENT : Role.EXPLORER,
          universityId: university?.id,
        },
      });

      await transaction.registrationVerification.delete({ where: { email } });
      return createdUser;
    });

    return NextResponse.json(
      {
        message: "Почта подтверждена. Аккаунт создан.",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to verify registration:", error);
    return NextResponse.json(
      { message: "Не удалось подтвердить код. Попробуйте позже." },
      { status: 500 },
    );
  }
}
