import { NextRequest, NextResponse } from 'next/server';

import { storeFinancialContext } from '@/lib/ai-memory';
import { adminAuth as auth, adminDb as db } from '@/lib/firebase-admin';
import { uploadDocumentAdmin } from '@/lib/firebase-storage-admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadDocumentAdmin(userId, buffer, file.name, category);

    // Store document metadata - GPT-4 Vision will read the file directly from URL
    const docData: any = {
      fileName: file.name,
      category,
      url,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
    };

    await db.collection(`users/${userId}/documents`).add(docData);

    // Store document reference in AI memory
    await storeFinancialContext(userId, {
      type: 'document',
      content: `Uploaded document: ${file.name} (${category})`,
      metadata: { category, fileName: file.name, url, fileType: file.type },
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
