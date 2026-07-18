import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type S3Config = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  forcePathStyle: boolean;
  publicUrl: string;
  region: string;
  secretAccessKey: string;
};

let s3Client: S3Client | null = null;

function getRequiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for S3 uploads`);
  }

  return value;
}

function getS3Config(): S3Config {
  return {
    accessKeyId: getRequiredEnvironmentVariable("S3_ACCESS_KEY_ID"),
    bucket: getRequiredEnvironmentVariable("S3_BUCKET"),
    endpoint: getRequiredEnvironmentVariable("S3_ENDPOINT"),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    publicUrl: getRequiredEnvironmentVariable("S3_PUBLIC_URL").replace(/\/+$/, ""),
    region: getRequiredEnvironmentVariable("S3_REGION"),
    secretAccessKey: getRequiredEnvironmentVariable("S3_SECRET_ACCESS_KEY"),
  };
}

export function createPublicS3Url(publicUrl: string, objectKey: string) {
  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${publicUrl.replace(/\/+$/, "")}/${encodedKey}`;
}

export async function uploadPublicObject({
  body,
  contentType,
  objectKey,
}: {
  body: Buffer;
  contentType: string;
  objectKey: string;
}) {
  const config = getS3Config();

  s3Client ??= new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: body,
      CacheControl: "public, max-age=31536000, immutable",
      ContentType: contentType,
    }),
  );

  return createPublicS3Url(config.publicUrl, objectKey);
}
