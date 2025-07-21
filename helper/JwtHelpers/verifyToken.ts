import { verify } from "hono/jwt";

// Define the type for the decoded token
interface DecodedToken {
  email: string;
  id: string;
  [key: string]: any;
}

// Define the type for the response object
interface TokenVerificationResponse {
  error?: string;
  decoded?: DecodedToken;
}

// Function to verify the token directly
export const verifyToken = async (token: string): Promise<TokenVerificationResponse> => {
  try {
    // Verify token using the 'verify' method from hono/jwt
    const decoded = (await verify(token, process.env.JWT_SECRET!)) ;

    if (!decoded || typeof decoded !== "object" || !decoded.email || !decoded.id) {
      return { error: "Invalid token" };
    }

    // Return decoded token on success
    return { decoded: decoded as DecodedToken };
  } catch (error) {
    return { error: "Token verification failed" };
  }
};

