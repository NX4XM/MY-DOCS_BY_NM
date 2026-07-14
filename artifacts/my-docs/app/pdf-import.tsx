import { Feather, Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
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
  Dimensions,
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

const SCREEN_W = Dimensions.get("window").width;

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
  const [selectedFrontIdx, setSelectedFrontIdx] = useState<number | null>(null);
  const [selectedBackIdx, setSelectedBackIdx] = useState<number | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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

  const loadPdf = async (path: string) => {
    if (Platform.OS === "web") {
      Alert.alert("Not available", "PDF import is only supported on mobile.");
      return;
    }
    setLoading(true);
    setPdfPath(path);
    try {
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (!fileInfo.exists) throw new Error("PDF not found");

      const mockPages: PdfPage[] = [
        {
          uri: path,
          width: 612,
          height: 792,
          selected: false,
          index: 0,
        },
      ];

      setPages(mockPages);
      setStep("select");
    } catch (err: any) {
      Alert.alert("PDF Error", err?.message ?? "Could not process PDF.");
      setStep("pick");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFront = (idx: number) => {
    setSelectedFrontIdx(idx);
  };

  const handleSelectBack = (idx: number) => {
    setSelectedBackIdx(idx);
  };

  const canProceed = selectedFrontIdx !== null && selectedBackIdx !== null;

  const handleImport = async () => {
    if (selectedFrontIdx === null || selectedBackIdx === null) return;
    if (!docName.trim()) {
      Alert.alert("Name needed", "Please enter a document name.");
      return;
    }

    setImporting(true);
    try {
      const frontPage = pages[selectedFrontIdx];
      const backPage = pages[selectedBackIdx];

      await addDocument(
        docName.trim(),
        category,
        frontPage.uri,
        backPage.uri
      );

      Alert.alert("Success", "Document saved with flip animation support!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Error", "Failed to save document.");
    } finally {
      setImporting(false);
    }
  };

  // STEP 1: Pick PDF
  if (step === "pick") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Import PDF
          </Text>
          <View style={styles.headerIcon} />
        </View>

        <View style={styles.center}>
          <View
            style={[
              styles.pickCard,
              {
                backgroundColor: colors.glassStrong,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <Feather name="file-text" size={48} color={colors.primary} />
            <Text style={[styles.pickTitle, { color: colors.foreground }]}>
              Import PDF Document
            </Text>
            <Text
              style={[styles.pickBody, { color: colors.mutedForeground }]}
            >
              Select a PDF file. Choose front and back pages, then save with
              flip animation.
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

  // STEP 2: Select Front & Back Pages
  if (step === "select") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => setStep("pick")} style={styles.headerIcon}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Select Front & Back
          </Text>
          <View style={styles.headerIcon} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={{ color: colors.mutedForeground, marginTop: 16 }}>
              Processing PDF...
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={[
                styles.selectScroll,
                { paddingBottom: bottomPad + 100 },
              ]}
            >
              <View style={styles.selectSection}>
                <Text
                  style={[
                    styles.selectSectionTitle,
                    { color: colors.foreground },
                  ]}
                >
                  📄 Front Page
                </Text>
                <FlatList
                  data={pages}
                  keyExtractor={(p) => `front-${p.index}`}
                  numColumns={2}
                  scrollEnabled={false}
                  contentContainerStyle={styles.pageGrid}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleSelectFront(item.index)}
                      style={[
                        styles.pageThumb,
                        {
                          width: (SCREEN_W - 56) / 2,
                          height: ((SCREEN_W - 56) / 2) * 1.414,
                          borderColor:
                            selectedFrontIdx === item.index
                              ? colors.primary
                              : colors.glassBorder,
                          backgroundColor:
                            selectedFrontIdx === item.index
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
                      {selectedFrontIdx === item.index && (
                        <View style={styles.selectedBadge}>
                          <Feather name="check" size={16} color="#FFF" />
                        </View>
                      )}
                      <Text style={styles.pageNum}>Page {item.index + 1}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>

              <View style={styles.selectSection}>
                <Text
                  style={[
                    styles.selectSectionTitle,
                    { color: colors.foreground },
                  ]}
                >
                  📄 Back Page
                </Text>
                <FlatList
                  data={pages}
                  keyExtractor={(p) => `back-${p.index}`}
                  numColumns={2}
                  scrollEnabled={false}
                  contentContainerStyle={styles.pageGrid}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleSelectBack(item.index)}
                      style={[
                        styles.pageThumb,
                        {
                          width: (SCREEN_W - 56) / 2,
                          height: ((SCREEN_W - 56) / 2) * 1.414,
                          borderColor:
                            selectedBackIdx === item.index
                              ? colors.primary
                              : colors.glassBorder,
                          backgroundColor:
                            selectedBackIdx === item.index
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
                      {selectedBackIdx === item.index && (
                        <View style={styles.selectedBadge}>
                          <Feather name="check" size={16} color="#FFF" />
                        </View>
                      )}
                      <Text style={styles.pageNum}>Page {item.index + 1}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </ScrollView>

            <View
              style={[
                styles.bottomBar,
                { paddingBottom: bottomPad + 16, backgroundColor: colors.background },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.continueBtn,
                  { backgroundColor: colors.primary },
                  !canProceed && { opacity: 0.4 },
                ]}
                onPress={() => setStep("config")}
                disabled={!canProceed}
              >
                <Text style={styles.continueBtnTxt}>Continue</Text>
                <Feather name="arrow-right" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  }

  // STEP 3: Configure
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => setStep("select")} style={styles.headerIcon}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Configure Document
        </Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.configScroll,
          { paddingBottom: bottomPad + 24 },
        ]}
      >
        <Text
          style={[styles.configLabel, { color: colors.mutedForeground }]}
        >
          Preview
        </Text>
        <View style={styles.previewRow}>
          {selectedFrontIdx !== null && (
            <View style={styles.previewCard}>
              <Text style={styles.previewCardLabel}>Front</Text>
              <Image
                source={{ uri: pages[selectedFrontIdx].uri }}
                style={styles.previewImg}
                contentFit="contain"
                transition={100}
              />
            </View>
          )}
          {selectedBackIdx !== null && (
            <View style={styles.previewCard}>
              <Text style={styles.previewCardLabel}>Back</Text>
              <Image
                source={{ uri: pages[selectedBackIdx].uri }}
                style={styles.previewImg}
                contentFit="contain"
                transition={100}
              />
            </View>
          )}
        </View>

        <Text
          style={[styles.configLabel, { color: colors.mutedForeground }]}
        >
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

        <Text
          style={[
            styles.configLabel,
            { color: colors.mutedForeground, marginTop: 12 },
          ]}
        >
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
                  {
                    color:
                      category === cat.key
                        ? "#FFF"
                        : colors.mutedForeground,
                  },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
              <Text style={styles.saveBtnTxt}>Save with Flip Animation</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },

  pickCard: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    gap: 16,
  },
  pickTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  pickBody: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  pickBtnTxt: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  selectScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },
  selectSection: {
    gap: 10,
  },
  selectSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 8,
  },
  pageGrid: {
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
  selectedBadge: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(107,142,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
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
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  continueBtnTxt: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },

  configScroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
  },
  configLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginTop: 12,
  },
  previewRow: {
    flexDirection: "row",
    gap: 16,
  },
  previewCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  previewCardLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    paddingTop: 8,
  },
  previewImg: {
    width: "100%",
    height: 160,
  },
  configInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  catList: { gap: 8, paddingVertical: 4 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipTxt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  saveBtnTxt: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
