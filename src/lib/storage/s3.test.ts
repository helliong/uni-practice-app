import assert from "node:assert/strict";
import test from "node:test";
import { createPublicS3Url } from "./s3";

test("public S3 URL joins and encodes object key segments", () => {
  assert.equal(
    createPublicS3Url("https://cdn.example.com/", "products/image name.webp"),
    "https://cdn.example.com/products/image%20name.webp",
  );
});
