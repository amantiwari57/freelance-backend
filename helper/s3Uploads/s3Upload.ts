import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  
  // Separate upload function
  async function uploadFileToS3(file: File): Promise<string> {  // Explicit type for file
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const fileBuffer = await file.arrayBuffer();
  
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: fileName,
          Body: Buffer.from(fileBuffer),
          ContentType: file.type,
        })
      );
  
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error("Error uploading to S3:", error); // Log the error for debugging
      throw error; // Re-throw the error to be caught by the route handler
    }
  }
  
  export default uploadFileToS3;