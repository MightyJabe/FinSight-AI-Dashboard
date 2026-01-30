'use client';

import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useSession } from '@/components/providers/SessionProvider';
import { db, storage } from '@/lib/firebase';

type DocumentCategory =
  | 'tax-returns'
  | 'pay-stubs'
  | 'statements'
  | 'contracts'
  | 'insurance'
  | 'other';

interface Document {
  id: string;
  fileName: string;
  category: string;
  uploadedAt: any;
  extractedText?: string;
  parsedData?: any;
  storagePath?: string;
  url?: string;
}

export default function DocumentsPage() {
  const { firebaseUser } = useSession();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [dragActive, setDragActive] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocuments = documents.filter(
    doc =>
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.extractedText?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!firebaseUser) return;

    console.log('Setting up listener for path:', `users/${firebaseUser.uid}/documents`);
    const q = collection(db, `users/${firebaseUser.uid}/documents`);

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        console.log('Snapshot received. Size:', snapshot.size);
        snapshot.docs.forEach(d => {
          const data = d.data();
          console.log('Doc ID:', d.id);
          console.log('  fileName:', data.fileName);
          console.log('  uploadedAt:', data.uploadedAt);
          console.log('  All fields:', Object.keys(data));
        });
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Document[];
        setDocuments(docs);
        setLoading(false);
      },
      error => {
        console.error('Error fetching documents:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !firebaseUser) return;

    const file = files[0];
    if (!file || file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      toast.success(`${file.name} uploaded successfully`);

      if (data.parsed) {
        toast.success('Document parsed and analyzed');
      }
    } catch (error) {
      toast.error('Upload failed');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleDelete = async (document: Document) => {
    if (!confirm(`Delete "${document.fileName}"?`)) return;

    setDeleting(document.id);
    try {
      const docRef = doc(db, `users/${firebaseUser!.uid}/documents`, document.id);
      await deleteDoc(docRef);

      if (document.url) {
        const fileRef = ref(storage, document.url);
        await deleteObject(fileRef);
      }

      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
      console.error('Delete error:', error);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display text-white tracking-tight">Documents</h1>
          <p className="mt-2 text-lg text-neutral-400">Upload and manage your financial documents</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="glass-card rounded-2xl p-6 border border-neutral-800/50">
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-neutral-300 mb-2">
                Document Category
              </label>
              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value as DocumentCategory)}
                className="w-full p-3 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
              >
                <option value="tax-returns">Tax Returns</option>
                <option value="pay-stubs">Pay Stubs</option>
                <option value="statements">Bank Statements</option>
                <option value="contracts">Contracts</option>
                <option value="insurance">Insurance Documents</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-700/50 bg-neutral-900/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => handleUpload(e.target.files)}
                className="hidden"
              />

              <div className="space-y-4">
                <div className="text-6xl">📄</div>
                <div>
                  <p className="text-lg font-medium text-white">
                    Drop your document here, or click to browse
                  </p>
                  <p className="text-sm text-neutral-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-2.5 rounded-full font-medium disabled:opacity-50 transition-all duration-300 shadow-lg shadow-blue-900/30"
                >
                  {uploading ? 'Uploading...' : 'Select File'}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-neutral-800/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Uploaded Documents</h2>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="px-4 py-2.5 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 w-64"
              />
            </div>
            {loading ? (
              <div className="text-center py-8 text-neutral-500">Loading...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">No documents uploaded yet</div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">No documents match your search</div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="w-full text-left p-4 rounded-xl border border-neutral-800/50 transition-all duration-300 hover:border-neutral-700/50 hover:shadow-xl hover:shadow-black/20 cursor-pointer bg-neutral-900/30 backdrop-blur-sm"
                    onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-white">{doc.fileName}</div>
                        <div className="text-sm text-neutral-400 mt-1">{doc.category}</div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {doc.uploadedAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(doc);
                          }}
                          disabled={deleting === doc.id}
                          className="text-rose-400 hover:text-rose-300 text-sm px-2 py-1 disabled:opacity-50 transition-colors"
                        >
                          {deleting === doc.id ? '...' : '🗑️'}
                        </button>
                        <div className="text-blue-400 text-sm">
                          {selectedDoc?.id === doc.id ? '▼' : '▶'}
                        </div>
                      </div>
                    </div>

                    {selectedDoc?.id === doc.id && (
                      <div className="mt-4 pt-4 border-t border-neutral-800/50">
                        {doc.url && (
                          <div className="mb-4">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-900/30"
                            >
                              📄 View/Download Document
                            </a>
                          </div>
                        )}
                        {doc.parsedData && (
                          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="font-semibold text-sm text-blue-300 mb-2">Extracted Data</div>
                            <pre className="text-xs text-neutral-300 whitespace-pre-wrap">
                              {JSON.stringify(doc.parsedData, null, 2)}
                            </pre>
                          </div>
                        )}
                        {doc.extractedText && (
                          <div>
                            <div className="font-semibold text-sm text-neutral-300 mb-2">Document Content</div>
                            <div className="p-3 bg-neutral-900/50 border border-neutral-800/50 rounded-xl max-h-64 overflow-y-auto">
                              <p className="whitespace-pre-wrap text-xs text-neutral-400">{doc.extractedText}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
