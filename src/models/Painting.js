import mongoose from "mongoose";

const paintingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    year: { type: Number },
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    imagePublicId: { type: String, trim: true },
    createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }

  },
  { timestamps: true }
);

export const Painting =
  mongoose.models.Painting || mongoose.model("Painting", paintingSchema);
