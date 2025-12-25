import express from "express";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { cloudinary } from "../cloudinary.js";

export const cloudinaryRouter = express.Router();

cloudinaryRouter.post(
  "/signature",
  authRequired,
  requireRole("admin"),
  (req, res) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "museum/paintings";

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  }
);
