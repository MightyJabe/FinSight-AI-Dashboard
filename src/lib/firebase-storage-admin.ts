import { getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

function getBucket() {
  const app = getApps()[0];
  if (!app) throw new Error('Firebase Admin not initialized');
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) throw new Error('Storage bucket not configured');
  return getStorage(app).bucket(bucketName);
}

export async function uploadDocumentAdmin(
  userId: string,
  file: Buffer,
  fileName: string,
  category: string
): Promise<string> {
  const bucket = getBucket();

  const timestamp = Date.now();
  const path = `users/${userId}/documents/${category}/${timestamp}-${fileName}`;

  const fileRef = bucket.file(path);
  await fileRef.save(file, {
    metadata: {
      contentType: 'application/pdf',
    },
  });

  await fileRef.makePublic();

  // Return proper Firebase download URL with token
  const [url] = await fileRef.getSignedUrl({
    action: 'read',
    expires: '03-01-2500', // Far future date
  });

  return url;
}
