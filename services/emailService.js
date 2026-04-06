const nodemailer = require("nodemailer");

/**
 * Gmail OTP mail — same behavior as ethical-hacking-user-service (nodemailer + EMAIL_USER / EMAIL_PASS).
 */
async function sendOTPEmail(email, otp) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    // Local dev: no Gmail — still allow signup; copy OTP from server logs.
    console.warn(
      `[Oceanic AI] OTP not emailed (set EMAIL_USER + EMAIL_PASS in .env for Gmail). OTP for ${email}: ${otp}`
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: user,
    to: email,
    subject: "Email Verification OTP",
    text: `Your OTP is: ${otp}`,
  });
}

module.exports = { sendOTPEmail };
