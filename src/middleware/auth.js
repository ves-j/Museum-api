import jwt from "jsonwebtoken";

export function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;


    const cookieToken = req.cookies?.token;
    const finalToken = token || cookieToken;

    if (!finalToken) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(finalToken, process.env.JWT_SECRET);
    req.user = payload; // { sub, role, email }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}
