import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

import { app } from './firebase';

const storage = getStorage(app);

export async function uploadReceipt(
  userId: string,
  file: File,
  transactionId?: string
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const path = transactionId
    ? `users/${userId}/receipts/${transactionId}/${fileName}`
    : `users/${userId}/receipts/${fileName}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadDocument(
  userId: string,
  file: File,
  category: 'tax-returns' | 'pay-stubs' | 'statements' | 'contracts' | 'insurance' | 'other'
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const path = `users/${userId}/documents/${category}/${fileName}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
