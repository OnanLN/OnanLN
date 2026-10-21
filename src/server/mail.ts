import "server-only";
import nodemailer from "nodemailer";

const PURPOSE_TEXT: Record<string, string> = {
  register: "注册位享",
  reset: "重置位享密码",
  release: "把位享登录换到当前网络",
};

export async function sendCodeMail(email: string, code: string, purpose: string): Promise<{ delivered: boolean }> {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("邮件服务未配置");
    }
    return { delivered: false };
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE !== "false",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  const action = PURPOSE_TEXT[purpose] || "验证身份";
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `位享验证码 ${code}`,
    text: `你正在${action}。验证码是 ${code}，10 分钟内有效。如果不是你本人操作，忽略这封邮件即可。`,
  });
  return { delivered: true };
}
