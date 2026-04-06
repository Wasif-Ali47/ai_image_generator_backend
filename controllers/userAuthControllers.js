const bcrypt = require("bcrypt");
const { setUser } = require("../services/userAuthService");
const { sendOTPEmail } = require("../services/emailService");
const User = require("../models/usersModel");
const {
  NETWORK_ERROR,
  SIGNED_UP,
  SIGN_UP_FAILED,
  USER_NOT_FOUND,
  WRONG_PASSWORD,
  LOGGED_IN,
  ALL_FILEDS_REQUIRED,
  NAME_REQUIRED,
  EMAIL_REQUIRED,
  PASSWORD_REQUIRED,
  OTP_SEND_FAILED,
  INVALID_OTP,
  EMAIL_NOT_VERIFIED,
  USER_ID_OTP_REQUIRED,
} = require("../messages/message");

// SIGN UP (OTP email — same flow as ethical-hacking-user-service)
async function handleUserSignUp(req, res) {
  const body = req.body;
  if (!body) return res.status(400).json({ message: ALL_FILEDS_REQUIRED });
  if (!body.name) return res.status(400).json({ message: NAME_REQUIRED });
  if (!body.email) return res.status(400).json({ message: EMAIL_REQUIRED });
  if (!body.password) return res.status(400).json({ message: PASSWORD_REQUIRED });

  try {
    const hashed = await bcrypt.hash(body.password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const result = await User.create({
      name: body.name,
      email: body.email,
      profession: body.profession ?? undefined,
      password: hashed,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      otp,
      emailVerified: false,
    });

    try {
      await sendOTPEmail(body.email.trim(), otp);
    } catch (mailErr) {
      console.error("OTP email error:", mailErr);
      await User.findByIdAndDelete(result._id);
      return res.status(500).json({ error: OTP_SEND_FAILED });
    }

    res.status(201).json({
      message: "User created. OTP sent to email.",
      userId: result._id,
      success: SIGNED_UP,
    });
  } catch (err) {
    console.error("DB create error:", err);
    res.status(500).json({ error: SIGN_UP_FAILED });
  }
}

// VERIFY OTP (same as ethical-hacking-user-service POST /auth/verify-otp)
async function handleVerifyOTP(req, res) {
  try {
    const { userId, otp } = req.body;
    if (
      userId == null ||
      otp === undefined ||
      otp === null ||
      String(otp).trim() === ""
    ) {
      return res.status(400).json({ error: USER_ID_OTP_REQUIRED });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: USER_NOT_FOUND });
    }

    if (user.otp !== String(otp).trim()) {
      return res.status(400).json({ error: INVALID_OTP });
    }

    user.emailVerified = true;
    user.otp = null;
    await user.save();

    res.json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("verify OTP error:", err);
    res.status(500).json({ error: NETWORK_ERROR });
  }
}

// LOGIN
async function handleUserLogin(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: USER_NOT_FOUND });

    if (user.emailVerified === false) {
      return res.status(400).json({ error: EMAIL_NOT_VERIFIED });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: WRONG_PASSWORD });
    const token = setUser(user);

    res.json({
      success: LOGGED_IN,
      userId: user._id,
      token: token,
      username: user.name,
      useremail: user.email,
    });
  } catch (err) {
    res.status(500).json({ error: NETWORK_ERROR });
  }
}

module.exports = {
  handleUserSignUp,
  handleUserLogin,
  handleVerifyOTP,
};
