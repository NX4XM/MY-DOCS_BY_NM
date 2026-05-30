import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

export interface Document {
  id: string;
  name: string;
  frontImageUri: string;
  backImageUri: string;
  createdAt: number;
}

interface DocumentContextValue {
  documents: Document[];
  isLoading: boolean;
  addDocument: (
    name: string,
    frontUri: string,
    backUri: string
  ) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  renameDocument: (id: string, name: string) => Promise<void>;
  updateDocumentImage: (
    id: string,
    side: "front" | "back",
    newUri: string
  ) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

const STORAGE_KEY = "mydocs_documents_v2";
const DOCS_DIR = (FileSystem.documentDirectory ?? "") + "mydocs/";

async function ensureDocsDir() {
  if (Platform.OS === "web") return;
  const info = await FileSystem.getInfoAsync(DOCS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOCS_DIR, { intermediates: true });
  }
}

async function saveImageLocally(
  uri: string,
  id: string,
  side: string
): Promise<string> {
  if (Platform.OS === "web") return uri;
  await ensureDocsDir();
  const dest = `${DOCS_DIR}${id}_${side}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Document[] = JSON.parse(stored);
        parsed.sort((a, b) => b.createdAt - a.createdAt);
        setDocuments(parsed);
      }
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = async (docs: Document[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  };

  const addDocument = async (
    name: string,
    frontUri: string,
    backUri: string
  ) => {
    const id =
      Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const localFront = await saveImageLocally(frontUri, id, "front");
    const localBack = await saveImageLocally(backUri, id, "back");
    const doc: Document = {
      id,
      name,
      frontImageUri: localFront,
      backImageUri: localBack,
      createdAt: Date.now(),
    };
    setDocuments((prev) => {
      const updated = [doc, ...prev];
      persist(updated);
      return updated;
    });
  };

  const deleteDocument = async (id: string) => {
    setDocuments((prev) => {
      const doc = prev.find((d) => d.id === id);
      if (doc && Platform.OS !== "web") {
        FileSystem.deleteAsync(doc.frontImageUri, { idempotent: true }).catch(
          () => {}
        );
        FileSystem.deleteAsync(doc.backImageUri, { idempotent: true }).catch(
          () => {}
        );
      }
      const updated = prev.filter((d) => d.id !== id);
      persist(updated);
      return updated;
    });
  };

  const renameDocument = async (id: string, name: string) => {
    setDocuments((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, name } : d));
      persist(updated);
      return updated;
    });
  };

  const updateDocumentImage = async (
    id: string,
    side: "front" | "back",
    newUri: string
  ) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    const localUri = await saveImageLocally(newUri, id, side);
    const oldUri = side === "front" ? doc.frontImageUri : doc.backImageUri;
    if (Platform.OS !== "web") {
      FileSystem.deleteAsync(oldUri, { idempotent: true }).catch(() => {});
    }
    setDocuments((prev) => {
      const updated = prev.map((d) => {
        if (d.id !== id) return d;
        return side === "front"
          ? { ...d, frontImageUri: localUri }
          : { ...d, backImageUri: localUri };
      });
      persist(updated);
      return updated;
    });
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        isLoading,
        addDocument,
        deleteDocument,
        renameDocument,
        updateDocumentImage,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentProvider");
  return ctx;
}
