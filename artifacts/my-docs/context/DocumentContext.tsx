import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert, Platform } from "react-native";

export const CATEGORIES = [
  { key: "aadhaar", label: "Aadhaar" },
  { key: "pan", label: "PAN Card" },
  { key: "atm", label: "ATM / Debit" },
  { key: "visiting", label: "Visiting Card" },
  { key: "id", label: "ID Card" },
  { key: "a4", label: "A4 Document" },
  { key: "passport", label: "Passport" },
  { key: "license", label: "License" },
  { key: "custom", label: "Other" },
] as const;

export type Category = (typeof CATEGORIES)[number]["key"];

export interface Document {
  id: string;
  name: string;
  category: Category;
  frontImageUri: string;
  backImageUri: string;
  isFavorite: boolean;
  createdAt: number;
}

interface DocumentContextValue {
  documents: Document[];
  isLoading: boolean;
  addDocument: (
    name: string,
    category: Category,
    frontUri: string,
    backUri: string
  ) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  renameDocument: (id: string, name: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  updateDocumentImage: (
    id: string,
    side: "front" | "back",
    newUri: string
  ) => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: () => Promise<void>;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

const STORAGE_KEY = "mydocs_v3";
const DOCS_DIR = (FileSystem.documentDirectory ?? "") + "mydocs/";

async function ensureDir() {
  if (Platform.OS === "web") return;
  const info = await FileSystem.getInfoAsync(DOCS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOCS_DIR, { intermediates: true });
  }
}

async function saveLocal(uri: string, id: string, side: string): Promise<string> {
  if (Platform.OS === "web") return uri;
  await ensureDir();
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
    category: Category,
    frontUri: string,
    backUri: string
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const localFront = await saveLocal(frontUri, id, "front");
    const localBack = await saveLocal(backUri, id, "back");
    const doc: Document = {
      id,
      name,
      category,
      frontImageUri: localFront,
      backImageUri: localBack,
      isFavorite: false,
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
        FileSystem.deleteAsync(doc.frontImageUri, { idempotent: true }).catch(() => {});
        FileSystem.deleteAsync(doc.backImageUri, { idempotent: true }).catch(() => {});
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

  const toggleFavorite = async (id: string) => {
    setDocuments((prev) => {
      const updated = prev.map((d) =>
        d.id === id ? { ...d, isFavorite: !d.isFavorite } : d
      );
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
    const localUri = await saveLocal(newUri, id + "_" + Date.now(), side);
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

  const exportBackup = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Backup is not supported on web.");
      return;
    }
    try {
      const backupDocs = await Promise.all(
        documents.map(async (doc) => {
          const frontB64 = await FileSystem.readAsStringAsync(doc.frontImageUri, {
            encoding: FileSystem.EncodingType.Base64,
          }).catch(() => "");
          const backB64 = await FileSystem.readAsStringAsync(doc.backImageUri, {
            encoding: FileSystem.EncodingType.Base64,
          }).catch(() => "");
          return { ...doc, frontBase64: frontB64, backBase64: backB64 };
        })
      );
      const json = JSON.stringify({ version: 1, docs: backupDocs }, null, 0);
      const backupPath = `${FileSystem.cacheDirectory}mydocs_backup_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(backupPath, json);
      await Sharing.shareAsync(backupPath, {
        mimeType: "application/json",
        dialogTitle: "Save My Docs Backup",
      });
    } catch (e) {
      Alert.alert("Export Failed", "Could not create backup file.");
    }
  };

  const importBackup = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Restore is not supported on web.");
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const { docs } = JSON.parse(content) as {
        version: number;
        docs: Array<Document & { frontBase64: string; backBase64: string }>;
      };
      await ensureDir();
      const restored: Document[] = await Promise.all(
        docs.map(async (d) => {
          const frontPath = `${DOCS_DIR}${d.id}_front.jpg`;
          const backPath = `${DOCS_DIR}${d.id}_back.jpg`;
          if (d.frontBase64) {
            await FileSystem.writeAsStringAsync(frontPath, d.frontBase64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          if (d.backBase64) {
            await FileSystem.writeAsStringAsync(backPath, d.backBase64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          return {
            id: d.id,
            name: d.name,
            category: d.category ?? "custom",
            frontImageUri: frontPath,
            backImageUri: backPath,
            isFavorite: d.isFavorite ?? false,
            createdAt: d.createdAt,
          };
        })
      );
      restored.sort((a, b) => b.createdAt - a.createdAt);
      setDocuments(restored);
      await persist(restored);
      Alert.alert("Restored", `${restored.length} document(s) restored successfully.`);
    } catch (e) {
      Alert.alert("Restore Failed", "Could not read backup file. Make sure it's a valid My Docs backup.");
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        isLoading,
        addDocument,
        deleteDocument,
        renameDocument,
        toggleFavorite,
        updateDocumentImage,
        exportBackup,
        importBackup,
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
