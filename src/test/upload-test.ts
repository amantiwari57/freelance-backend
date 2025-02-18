import { Hono } from "hono";
import uploadFileToS3 from "../../helper/s3Uploads/s3Upload";


// Initialize Hono app
const upload = new Hono();

// Initialize AWS S3 Client
upload.post("/test/upload", async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file");
  
      if (!(file instanceof File)) {
        return c.json({ error: "No file uploaded" }, 400);
      }
  
      const fileUrl = await uploadFileToS3(file); // Call the separate function
  
      return c.json({
        message: "File uploaded successfully",
        fileUrl: fileUrl,
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