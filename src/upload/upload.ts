import { Hono } from "hono";
import uploadFileToS3 from "../../helper/s3Uploads/s3Upload";
import { verifyToken } from "../../helper/JwtHelpers/verifyToken";


const upload = new Hono();

upload.post("/upload", async (c) => {
  try {
    // Get the Authorization header
  

    // Get form data
    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    // Upload file to S3
    const fileUrl = await uploadFileToS3(file);

    return c.json({
      message: "File uploaded successfully",
      fileUrl: fileUrl,
      // uploadedBy: userId, // Include the user ID in response
    });
  } catch (error) {
    return c.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default upload;
