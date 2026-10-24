import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { randomUUID } from "node:crypto";
@Injectable()
export class StorageService {
  async upload(file: Express.Multer.File | undefined) {
    if (!file || file.size > 8 * 1024 * 1024)
      throw new BadRequestException("Upload an image or PDF up to 8 MB");
    let body: Buffer;
    let type: string;
    let extension: string;
    try {
      if (file.mimetype === "application/pdf") {
        if (!file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-")))
          throw new Error();
        const doc = await PDFDocument.load(file.buffer);
        if (!doc.getPageCount()) throw new Error();
        body = file.buffer;
        type = "application/pdf";
        extension = "pdf";
      } else {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
          throw new Error();
        const image = sharp(file.buffer, { limitInputPixels: 20000000 });
        const metadata = await image.metadata();
        if (!["jpeg", "png", "webp"].includes(metadata.format || ""))
          throw new Error();
        body = await image
          .rotate()
          .resize({
            width: 2400,
            height: 2400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
        type = "image/webp";
        extension = "webp";
      }
    } catch {
      throw new BadRequestException(
        "Invalid image or PDF. SVG uploads are not accepted.",
      );
    }
    const {
      S3_BUCKET,
      S3_PUBLIC_URL,
      S3_ENDPOINT,
      S3_REGION,
      S3_ACCESS_KEY_ID,
      S3_SECRET_ACCESS_KEY,
    } = process.env;
    if (
      !S3_BUCKET ||
      !S3_PUBLIC_URL ||
      !S3_ACCESS_KEY_ID ||
      !S3_SECRET_ACCESS_KEY
    )
      throw new ServiceUnavailableException("Upload storage is not configured");
    const key = `portfolio/${randomUUID()}.${extension}`;
    const client = new S3Client({
      region: S3_REGION || "auto",
      endpoint: S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: type,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { url: `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`, type };
  }
}
