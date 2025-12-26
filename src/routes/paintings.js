import express from "express";
import { z } from "zod";
import { Painting } from "../models/Painting.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { cloudinary } from "../cloudinary.js";


export const paintingsRouter = express.Router();

// Public: list paintings
paintingsRouter.get("/", authRequired, async (req, res) => {
  const items = await Painting.find().sort({ createdAt: -1 });
  res.json(items);
});

// Public: get by id
paintingsRouter.get("/:id", authRequired, async (req, res) => {
  const item = await Painting.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

// Admin: create painting (for now imageUrl is a plain string; Step 2 will use Cloudinary)
paintingsRouter.post(
  "/",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({
        title: z.string().min(1),
        artist: z.string().min(1),
        year: z.number().int().optional(),
        description: z.string().optional(),
        imageUrl: z.string().url().optional(),
        imagePublicId: z.string().optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    const painting = await Painting.create({
      ...parsed.data,
      createdByAdminId: req.user.sub
    });

    res.status(201).json(painting);
  }
);

// Admin: delete painting
paintingsRouter.delete(
  "/:id",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    const painting = await Painting.findById(req.params.id);
    if (!painting) return res.status(404).json({ message: "Not found" });


    if (painting.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(painting.imagePublicId, {
          invalidate: true
        });
      } catch (e) {

        console.error("Cloudinary delete failed:", e?.message || e);
      }
    }

    await Painting.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  }
);

