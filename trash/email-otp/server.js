require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const otps = new Map();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function genOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post("/api/send-otp", async (req, res) => {
  const email = req.body.email;
  if (!email) return res.json({ ok: false, error: "Email required" });

  const otp = genOTP();
  const expires = Date.now() + 5 * 60 * 1000;
  otps.set(email, { otp, expires });

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
      html: `<p>Your OTP is poda myre <b>${otp}</b></p>`
    });

    res.json({ ok: true, message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "Failed to send OTP" });
  }
});

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.json({ ok: false, error: "Missing fields" });

  const record = otps.get(email);
  if (!record) return res.json({ ok: false, error: "OTP not found" });

  if (Date.now() > record.expires) {
    otps.delete(email);
    return res.json({ ok: false, error: "OTP expired" });
  }

  if (otp !== record.otp) return res.json({ ok: false, error: "Invalid OTP" });

  otps.delete(email);
  res.json({ ok: true, message: "OTP verified!" });
});

app.listen(PORT, () => console.log("Server ready on port", PORT));
