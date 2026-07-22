import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const rawPassword = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !from || Boolean(user) !== Boolean(rawPassword)) {
    throw new Error("SMTP configuration is incomplete");
  }

  const password = rawPassword
    ? host === "smtp.gmail.com" ? rawPassword.replace(/\s/g, "") : rawPassword
    : undefined;

  return { host, port, user, password, from };
}

export async function sendRegistrationCode(email: string, code: string) {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    ...(config.user && config.password
      ? { auth: { user: config.user, pass: config.password } }
      : {}),
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Код подтверждения Campus & Code",
    text: `Ваш код подтверждения: ${code}. Код действует 10 минут.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.5">
        <h2 style="margin-bottom:12px">Подтверждение почты</h2>
        <p>Введите этот код, чтобы завершить регистрацию в Campus &amp; Code:</p>
        <p style="font-size:30px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</p>
        <p style="color:#6b7280">Код действует 10 минут. Если вы не регистрировались, проигнорируйте письмо.</p>
      </div>
    `,
  });
}
