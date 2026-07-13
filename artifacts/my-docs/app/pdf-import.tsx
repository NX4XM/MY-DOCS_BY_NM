import { Feather, Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import PdfThumbnail from "react-native-pdf-thumbnail";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORIES, Category, useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

interface PdfPage {
  uri: string;
  width: number;
  height: number;
  selected: boolean;
  index: number;
}

export default function PdfImportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addDocument } = useDocuments();

  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"pick" | "select" | "config">("pick");
  const [category, setCategory] = useState<Category>("custom");
  const [docName, setDocName] = useState("");
  const [assignFrontBack, setAssignFrontBack] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Pick PDF file
  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      await loadPdf(result.assets[0].uri);
    } catch {
      Alert.alert("Error", "Could not load PDF.");
    }
  };

  // Generate thumbnails for all pages
  const loadPdf = async (path: string) => {
    if (Platform.OS === "web") {
      Alert.alert("Not available", "PDF import is only supported on the mobile app.");
      return;
    }
    setLoading(true);
    setPdfPath(path);
    try {
      const results = await PdfThumbnail.generateAllPages(path, 400);
      const pgs: PdfPage[] = results.map((result, i) => ({
        uri: result.uri,
        width: result.width,
        height: result.height,
        selected: false,
        index: i,
      }));
      setPages(pgs);
      setStep("select");
    } catch (err: any) {
      Alert.alert("PDF Error", err?.message ?? "Could not process PDF.");
      setStep("pick");
    } finally {
      setLoading(false);
    }
  };

  const togglePage = (idx: number) => {
    setPages((prev) =>
      prev.map((p) => (p.index === idx ? { ...p, selected: !p.selected } : p))
    );
  };

  const selectAll = () => setPages((prev) => prev.map((p) => ({ ...p, selected: true })));
  const selectNone = () => setPages((prev) => prev.map((p) => ({ ...p, selected: false })));

  const selectedCount = pages.filter((p) => p.selected).length;
  const selectedPages = pages.filter((p) => p.selected);

  // Import selected pages
  const handleImport = async () => {
    if (selectedCount === 0) return;
    if (!docName.trim()) {
      Alert.alert("Name needed", "Please enter a document name.");
      return;
    }

    setImporting(true);
    try {
      if (selectedCount === 2 && assignFrontBack) {
        // Front + Back from 2 pages
        const frontPg = selectedPages[0];
        const backPg = selectedPages[1];
        await addDocument(docName.trim(), category, frontPg.uri, backPg.uri);
      } else if (selectedCount >= 2) {
        // Multi-page: save each as individual document with page number
        for (let i = 0; i < selectedPages.length; i++) {
          const pg = selectedPages[i];
          const name = `${docName.trim()} (${i + 1})`;
          await addDocument(name, category, pg.uri, pg.uri);
        }
      } else {
        // Single page: same for front and back
        const pg = selectedPages[0];
        await addDocument(docName.trim(), category, pg.uri, pg.uri);
      }

      Alert.alert(
        "Imported",
        `${selectedCount} page${selectedCount > 1 ? "s" : ""} saved as ${selectedCount === 2 && assignFrontBack ? "1 document" : selectedCount + " document(s)"}.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Error", "Failed to import PDF pages.");
    } finally {
      setImporting(false);
    }
  };

  // ── STEP 1: Pick PDF ──
  if (step === "pick") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Import PDF</Text>
          <View style={styles.headerIcon} />
        </View>

        <View style={styles.center}>
          <View style={[styles.pickCard, { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}>
            <Feather name="file-text" size={48} color={colors.primary} />
            <Text style={[styles.pickTitle, { color: colors.foreground }]}>
              Import from PDF
            </Text>
            <Text style={[styles.pickBody, { color: colors.mutedForeground }]}>
              Select a PDF file. You can pick which pages to keep and save them as documents.
            </Text>
            <TouchableOpacity
              style={[styles.pickBtn, { backgroundColor: colors.primary }]}
              onPress={pickPdf}
            >
              <Feather name="folder" size={16} color="#FFF" />
              <Text style={styles.pickBtnTxt}>Choose PDF File</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── STEP 2: Select Pages ──
  if (step === "select") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => setStep("pick")} style={styles.headerIcon}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Select Pages ({selectedCount})
          </Text>
          <View style={styles.headerIcon} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={{ color: colors.mutedForeground, marginTop: 16 }}>
              Generating page previews...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.selectActions}>
              <TouchableOpacity style={[styles.selectAction, { borderColor: colors.glassBorder }]} onPress={selectAll}>
                <Feather name="check-square" size={14} color={colors.foreground} />
                <Text style={[styles.selectActionTxt, { color: colors.foreground }]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.selectAction, { borderColor: colors.glassBorder }]} onPress={selectNone}>
                <Feather name="square" size={14} color={colors.foreground} />
                <Text style={[styles.selectActionTxt, { color: colors.foreground }]}>None</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={pages}
              keyExtractor={(p) => String(p.index)}
              numColumns={2}
              contentContainerStyle={[
                styles.pageList,
                { paddingBottom: bottomPad + 80 },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => togglePage(item.index)}
                  style={[
                    styles.pageThumb,
                    {
                      width: (SCREEN_W - 48) / 2,
                      height: ((SCREEN_W - 48) / 2) * 1.414,
                      borderColor: item.selected ? colors.primary : colors.glassBorder,
                      backgroundColor: item.selected
                        ? "rgba(107,142,255,0.12)"
                        : colors.glassStrong,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="contain"
                    transition={100}
                  />
                  <View style={styles.checkbox}>
                    <View
                      style={[
                        styles.checkboxInner,
                        {
                          backgroundColor: item.selected ? colors.primary : "transparent",
                          borderColor: item.selected ? colors.primary : "rgba(255,255,255,0.5)",
                        },
                      ]}
                    >
                      {item.selected && <Feather name="check" size={12} color="#FFF" />}
                    </View>
                  </View>
                  <Text style={styles.pageNum}>Page {item.index + 1}</Text>
                </TouchableOpacity>
              )}
            />

            <View style={[styles.bottomBar, { paddingBottom: bottomPad + 16 }]}>
              <TouchableOpacity
                style={[
                  styles.continueBtn,
                  { backgroundColor: colors.primary },
                  selectedCount === 0 && { opacity: 0.4 },
                ]}
                onPress={() => setStep("config")}
                disabled={selectedCount === 0}
              >
                <Text style={styles.continueBtnTxt}>Continue ({selectedCount})</Text>
                <Feather name="arrow-right" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  }

  // ── STEP 3: Configure (name + category + front/back) ──
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => setStep("select")} style={styles.headerIcon}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Configure</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.configScroll,
          { paddingBottom: bottomPad + 24 },
        ]}
      >
        {/* Selected pages preview */}
        <Text style={[styles.configLabel, { color: colors.mutedForeground }]}>
          {selectedCount} page{selectedCount > 1 ? "s" : ""} selected
        </Text>
        <FlatList
          data={selectedPages}
          keyExtractor={(p) => String(p.index)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
          renderItem={({ item }) => (
            <View style={styles.configThumb}>
              <Image
                source={{ uri: item.uri }}
                style={styles.configThumbImg}
                contentFit="contain"
                transition={100}
              />
              <Text style={styles.configThumbLabel}>Page {item.index + 1}</Text>
            </View>
          )}
        />

        {/* Name */}
        <Text style={[styles.configLabel, { color: colors.mutedForeground }]}>
          Document Name
        </Text>
        <TextInput
          style={[
            styles.configInput,
            {
              backgroundColor: colors.glassStrong,
              borderColor: colors.glassBorder,
              color: colors.foreground,
            },
          ]}
          value={docName}
          onChangeText={setDocName}
          placeholder="e.g. Passport, Aadhaar..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoFocus
          maxLength={50}
        />

        {/* Category */}
        <Text style={[styles.configLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
          Document Type
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.catChip,
                {
                  backgroundColor:
                    category === cat.key ? colors.primary : colors.glassStrong,
                  borderColor:
                    category === cat.key ? colors.primary : colors.glassBorder,
                },
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <Text
                style={[
                  styles.catChipTxt,
                  { color: category === cat.key ? "#FFF" : colors.mutedForeground },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Front/Back toggle if exactly 2 pages */}
        {selectedCount === 2 && (
          <View style={[styles.fbToggle, { borderColor: colors.glassBorder, backgroundColor: colors.glassStrong }]}>
            <TouchableOpacity
              style={[styles.fbOption, !assignFrontBack && { backgroundColor: colors.primary }]}
              onPress={() => setAssignFrontBack(false)}
            >
              <Text style={[styles.fbTxt, { color: !assignFrontBack ? "#FFF" : colors.mutedForeground }]}>
                Separate docs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.fbOption, assignFrontBack && { backgroundColor: colors.primary }]}
              onPress={() => setAssignFrontBack(true)}
            >
              <Text style={[styles.fbTxt, { color: assignFrontBack ? "#FFF" : colors.mutedForeground }]}>
                Page 1 = Front, Page 2 = Back
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: colors.primary },
            (importing || !docName.trim()) && { opacity: 0.5 },
          ]}
          onPress={handleImport}
          disabled={importing || !docName.trim()}
        >
          {importing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#FFF" />
              <Text style={styles.saveBtnTxt}>Save to My Docs</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const SCREEN_W = 360;

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", textAlign: "center" },

  // Pick step
  pickCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    gap: 16,
  },
  pickTitle: { fontSize: 22, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  pickBody: { fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 22 },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  pickBtnTxt: { color: "#FFF", fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },

  // Select step
  selectActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectActionTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  pageList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pageThumb: {
    margin: 4,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pageNum: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: "#FFF",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 14,
    backgroundColor: "rgba(8,8,15,0.9)",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  continueBtnTxt: { color: "#FFF", fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },

  // Config step
  configScroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 8,
  },
  configLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginTop: 12,
  },
  configInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  configThumb: {
    width: 120,
    height: 170,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  configThumbImg: { width: 120, height: 150 },
  configThumbLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
  catList: { gap: 8, paddingVertical: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catChipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fbToggle: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    overflow: "hidden",
  },
  fbOption: { flex: 1, paddingVertical: 14, alignItems: "center" },
  fbTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  saveBtnTxt: { color: "#FFF", fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
});
