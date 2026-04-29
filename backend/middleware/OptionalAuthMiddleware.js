import jwt from "jsonwebtoken";

// Attaches req.user if a valid token is present, but does NOT reject the request
// if no token is provided. Used for routes that are public but show different
// content to authenticated users (e.g. profile visibility).
const optionalAuth = (req, res, next) => {
  const auth  = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { userId, ... }
    } catch {
      // Invalid token — treat as unauthenticated, don't block
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

export default optionalAuth;