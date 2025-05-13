import { verify } from "hono/jwt";

// Define the type for the decoded token
interface DecodedToken {
  email: string;
  id: string;
}

// Define the type for the response object
interface TokenVerificationResponse {
  error?: string;
  decoded?: DecodedToken;
}

// Function to verify the token directly
export const MessageVerifyToken = async (token: string): Promise<TokenVerificationResponse> => {
  try {
    // Verify token using the 'verify' method from hono/jwt
    const decoded = await verify(token, process.env.KAFKA_SECRET!);

    // Typecast JWTPayload to DecodedToken after verifying the token
    const decodedToken = decoded as unknown as DecodedToken;

    if (!decodedToken || !decodedToken.email || !decodedToken.id) {
      return { error: "Invalid token" };
    }

    // Return decoded token on success
    return { decoded: decodedToken };
  } catch (error) {
    return { error: "Token verification failed" };
  }
};
