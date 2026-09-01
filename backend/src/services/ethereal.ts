import nodemailer from 'nodemailer';

let testAccount: nodemailer.TestAccount | null = null;
let transporter: nodemailer.Transporter | null = null;

export async function getEtherealTransporter() {
  if (!transporter) {
    console.log('[Ethereal] Creating test SMTP account...');
    testAccount = await nodemailer.createTestAccount();
    console.log(`[Ethereal] Account created! User: ${testAccount.user}`);

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return { transporter, testAccount };
}

export async function sendEtherealEmail(options: {
  from: string;
  to: string;
  subject: string;
  text: string;
}) {
  const { transporter } = await getEtherealTransporter();

  const info = await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: `<div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">${options.text.replace(/\n/g, '<br/>')}</div>`,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`[Ethereal SMTP] Email sent to ${options.to}. Message ID: ${info.messageId}`);
  if (previewUrl) {
    console.log(`[Ethereal SMTP] Preview URL: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl: previewUrl || undefined,
  };
}
