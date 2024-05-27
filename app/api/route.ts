import { Storage } from "@google-cloud/storage";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

const storage = new Storage({
  projectId: process.env.PROJECT_ID,
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY,
  },
});

const bucketName = process.env.BUCKET_NAME as string;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: false,
    },
  },
};

export async function POST(req: NextRequest) {
  if (req.method === "POST") {
    const formData: any = await req.formData();
    const files: File[] = [];

    for (const entry of formData.entries()) {
      const [name, value] = entry;
      if (value instanceof File) {
        files.push(value);
      }
    }

    const uploadPromises = files.map(async (file) => {
      const blob = storage.bucket(bucketName).file(file.name);
      const stream = blob.createWriteStream({
        resumable: false,
        contentType: file.type,
        metadata: {
          contentType: file.type,
        },
      });

      const buffer = await file.arrayBuffer();
      const readableStream = new Readable();
      readableStream._read = () => {};
      readableStream.push(Buffer.from(buffer));
      readableStream.push(null);

      return new Promise<string>((resolve, reject) => {
        readableStream
          .pipe(stream)
          .on("finish", () => resolve(`Uploaded ${file.name} successfully.`))
          .on("error", (err) =>
            reject(`Failed to upload ${file.name}: ${err}`)
          );
      });
    });

    try {
      const uploadResults: string[] = await Promise.all(uploadPromises);
      console.log(uploadResults);
      return NextResponse.json({
        message: "Image uploaded successfully!",
        results: uploadResults,
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { message: "error", error: (error as Error).message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}
