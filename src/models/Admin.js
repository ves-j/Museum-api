import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);
