import { verifyToken } from "../JwtHelpers/verifyToken";

export const authenticate = async (c: any) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Authorization token is required" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const tokenVerification = await verifyToken(token);
    if (tokenVerification.error) {
      return c.json({ error: tokenVerification.error }, 401);
    }

    return tokenVerification.decoded!.id; // ✅ Return user ID
  } catch (error) {
    return c.json({ error: "Authentication failed" }, 401);
  }
};