import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { validateProductImageUpload } from "@/lib/serverImageValidation";

const allowedUploadRoles = new Set(["SUPERADMIN", "UNIVERSITY_ADMIN"]);

function getSafeFileName(fileName: string) {
  const extension = extname(fileName).toLowerCase();

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !allowedUploadRoles.has(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const validationError = validateProductImageUpload(file, buffer);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Save to public/uploads
    // Using a simple timestamp + random string to avoid name collisions
    const fileName = getSafeFileName(file.name);
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    await mkdir(uploadDir, { recursive: true });

    const path = join(uploadDir, fileName);
    await writeFile(path, buffer);

    // Return the public URL
    return NextResponse.json({ url: `/uploads/${fileName}` });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
