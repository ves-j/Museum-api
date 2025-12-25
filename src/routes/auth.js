import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { Admin } from "../models/Admin.js";

export const authRouter = express.Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

function signToken({ id, role, email }) {
  return jwt.sign(
    { sub: id, role, email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Register normal user
authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { name, email, password } = parsed.data;

  const existingUser = await User.findOne({ email });
  const existingAdmin = await Admin.findOne({ email });
  if (existingUser || existingAdmin) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  return res.status(201).json({ message: "User created", id: user._id });
});

// Register admin (requires invite code)
authRouter.post("/register-admin", async (req, res) => {
  const schema = registerSchema.extend({
    inviteCode: z.string().min(1)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { name, email, password, inviteCode } = parsed.data;
  if (inviteCode !== process.env.ADMIN_INVITE_CODE) {
    return res.status(403).json({ message: "Invalid invite code" });
  }

  const existingUser = await User.findOne({ email });
  const existingAdmin = await Admin.findOne({ email });
  if (existingUser || existingAdmin) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await Admin.create({ name, email, passwordHash });

  return res.status(201).json({ message: "Admin created", id: admin._id });
});

// Login (checks admin first, then user)
authRouter.post("/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { email, password } = parsed.data;

  const admin = await Admin.findOne({ email });
  if (admin) {
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: admin._id.toString(), role: "admin", email });
    return res.json({ token, role: "admin" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user._id.toString(), role: "user", email });
  return res.json({ token, role: "user" });
});
