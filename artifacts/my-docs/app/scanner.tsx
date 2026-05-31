import { Feather, Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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

import { CropView } from "@/components/CropView";
import { ScanOverlay } from "@/components/ScanOverlay";
import { CATEGORIES, Category, useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

type Step =
  | "front_cam"
  | "front_crop"
  | "front_preview"
  | "back_cam"
  | "back_crop"
  | "back_preview"
  | "name";

type ScanMode = "card" | "a4";

interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}

export default function ScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addDocument } = useDocuments();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<Step>("front_cam");
  const [scanMode, setScanMode] = useState<ScanMode>("card");
  const [torchOn, setTorchOn] = useState(false);
  const [frontPhoto, setFrontPhoto] = useState<CapturedPhoto | null>(null);
  const [backPhoto, setBackPhoto] = useState<CapturedPhoto | null>(null);
  const [frontFinal, setFrontFinal] = useState<string | null>(null);
  const [backFinal, setBackFinal] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [category, setCategory] = useState<Category>("custom");
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const capture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    try {
      // Let autofocus settle before firing shutter (Android needs this)
      if (Platform.OS === "android") {
        await new Promise<void>((r) => setTimeout(r, 350));
      }
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,          // capture at maximum sensor quality
        skipProcessing: false,
      });
      if (!photo) return;
      if (step === "front_cam") {
        setFrontPhoto({ uri: photo.uri, width: photo.width ?? 1200, height: photo.height ?? 900 });
        setStep("front_crop");
      } else {
        setBackPhoto({ uri: photo.uri, width: photo.width ?? 1200, height: photo.height ?? 900 });
        setStep("back_crop");
      }
    } catch {
      Alert.alert("Error", "Failed to capture. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  // Enhance a full (un-cropped) photo when user skips the crop step
  const enhanceAndSkip = async (photo: CapturedPhoto, side: "front" | "back") => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: Math.min(photo.width, 2200) } }],
        { compress: 0.97, format: ImageManipulator.SaveFormat.JPEG }
      );
      if (side === "front") {
        setFrontFinal(result.uri);
        setStep("front_preview");
      } else {
        setBackFinal(result.uri);
        setStep("back_preview");
      }
    } catch {
      // fallback: use raw photo
      if (side === "front") {
        setFrontFinal(photo.uri);
        setStep("front_preview");
      } else {
        setBackFinal(photo.uri);
        setStep("back_preview");
      }
    }
  };

  const handleFrontCropped = (uri: string) => {
    setFrontFinal(uri);
    setStep("front_preview");
  };
  const handleBackCropped = (uri: string) => {
    setBackFinal(uri);
    setStep("back_preview");
  };

  const handleSave = async () => {
    if (!frontFinal || !backFinal || !docName.trim()) return;
    setSaving(true);
    try {
      await addDocument(docName.trim(), category, frontFinal, backFinal);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save document.");
    } finally {
      setSaving(false);
    }
  };

  const stepNum = {
    front_cam: 1, front_crop: 1, front_preview: 1,
    back_cam: 2, back_crop: 2, back_preview: 2,
    name: 3,
  }[step];

  const stepLabel = {
    front_cam: "Scan Front Side",
    front_crop: "Align & Crop",
    front_preview: "Front Preview",
    back_cam: "Scan Back Side",
    back_crop: "Align & Crop",
    back_preview: "Back Preview",
    name: "Name Document",
  }[step];

  // Permission loading
  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingHorizontal: 40 }]}>
        <Ionicons name="camera-outline" size={56} color={colors.mutedForeground} />
        <Text style={[styles.permTitle, { color: colors.foreground }]}>
          Camera Access Needed
        </Text>
        <Text style={[styles.permBody, { color: colors.mutedForeground }]}>
          My Docs needs camera access to scan your documents and cards.
        </Text>
        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 14 }}>
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Crop step
  if ((step === "front_crop" && frontPhoto) || (step === "back_crop" && backPhoto)) {
    const photo = step === "front_crop" ? frontPhoto! : backPhoto!;
    return (
      <View style={[styles.root, { backgroundColor: "#000" }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setStep(step === "front_crop" ? "front_cam" : "back_cam")}
          >
            <Feather name="arrow-left" size={18} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.stepLabel}>{stepLabel}</Text>
          <View style={{ width: 40 }} />
        </View>
        <CropView
          uri={photo.uri}
          origW={photo.width}
          origH={photo.height}
          onCropped={step === "front_crop" ? handleFrontCropped : handleBackCropped}
          onSkip={() => {
            enhanceAndSkip(photo, step === "front_crop" ? "front" : "back");
          }}
        />
      </View>
    );
  }

  const showCamera = step === "front_cam" || step === "back_cam";

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Feather name="x" size={18} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.stepInfo}>
          <Text style={styles.stepLabel}>{stepLabel}</Text>
          <Text style={styles.stepSub}>Step {stepNum} of 3</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Camera or Preview or Name */}
      {showCamera ? (
        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            autofocus="on"
            enableTorch={torchOn}
            onCameraReady={() => setCameraReady(true)}
          />
          <View style={styles.camOverlay}>
            <LinearGradient
              colors={["rgba(0,0,0,0.55)", "transparent", "transparent", "rgba(0,0,0,0.55)"]}
              style={StyleSheet.absoluteFill}
            />

            {/* Scanner mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  scanMode === "card" && styles.modeActive,
                ]}
                onPress={() => {
                  setScanMode("card");
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="card-outline" size={14} color={scanMode === "card" ? "#FFF" : "rgba(255,255,255,0.5)"} />
                <Text style={[styles.modeTxt, { color: scanMode === "card" ? "#FFF" : "rgba(255,255,255,0.5)" }]}>
                  Card
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  scanMode === "a4" && styles.modeActive,
                ]}
                onPress={() => {
                  setScanMode("a4");
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="document-outline" size={14} color={scanMode === "a4" ? "#FFF" : "rgba(255,255,255,0.5)"} />
                <Text style={[styles.modeTxt, { color: scanMode === "a4" ? "#FFF" : "rgba(255,255,255,0.5)" }]}>
                  A4
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scan overlay */}
            <ScanOverlay mode={scanMode} />

            <Text style={styles.camHint}>
              Position the {step === "front_cam" ? "front" : "back"} within the frame
            </Text>

            {/* Torch button */}
            <TouchableOpacity
              style={[styles.torchBtn, torchOn && styles.torchActive]}
              onPress={() => {
                setTorchOn((v) => !v);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name={torchOn ? "flash" : "flash-outline"}
                size={20}
                color={torchOn ? "#FFC400" : "#FFF"}
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : step === "name" ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.nameContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
            <Text style={styles.nameTitle}>Name Your Document</Text>
            <Text style={[styles.nameSub, { color: colors.mutedForeground }]}>
              Give it a name you'll recognize
            </Text>
            <TextInput
              value={docName}
              onChangeText={setDocName}
              placeholder="e.g. Passport, Aadhaar, John's ATM..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoFocus
              style={[
                styles.nameInput,
                {
                  backgroundColor: colors.glassStrong,
                  borderColor: colors.glassBorder,
                  color: colors.foreground,
                },
              ]}
              returnKeyType="done"
              maxLength={50}
            />

            {/* Category picker */}
            <Text style={[styles.catLabel, { color: colors.mutedForeground }]}>
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
                        category === cat.key
                          ? colors.primary
                          : colors.glassStrong,
                      borderColor:
                        category === cat.key
                          ? colors.primary
                          : colors.glassBorder,
                    },
                  ]}
                  onPress={() => {
                    setCategory(cat.key);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.catChipTxt,
                      {
                        color:
                          category === cat.key ? "#FFF" : colors.mutedForeground,
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.previewContainer}>
          <Image
            source={{
              uri: (step === "front_preview" ? frontFinal : backFinal) ?? "",
            }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeTxt}>
              {step === "front_preview" ? "FRONT" : "BACK"} CAPTURED
            </Text>
          </View>
        </View>
      )}

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: bottomPad + 16 }]}>
        {showCamera && (
          <TouchableOpacity
            style={[
              styles.captureBtn,
              (capturing || !cameraReady) && { opacity: 0.45 },
            ]}
            onPress={capture}
            disabled={capturing || !cameraReady}
          >
            {capturing ? (
              <ActivityIndicator color="#FFF" size="large" />
            ) : !cameraReady ? (
              <ActivityIndicator color="rgba(255,255,255,0.5)" size="small" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
        )}

        {step === "front_preview" && (
          <View style={styles.rowBtns}>
            <TouchableOpacity
              style={[styles.rowBtn, { borderColor: colors.glassBorder, backgroundColor: colors.glassStrong }]}
              onPress={() => setStep("front_cam")}
            >
              <Feather name="rotate-ccw" size={15} color="#FFF" />
              <Text style={[styles.rowBtnTxt, { color: "#FFF" }]}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rowBtn, styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setCameraReady(false); setStep("back_cam"); }}
            >
              <Text style={[styles.rowBtnTxt, { color: "#FFF" }]}>Scan Back</Text>
              <Feather name="arrow-right" size={15} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {step === "back_preview" && (
          <View style={styles.rowBtns}>
            <TouchableOpacity
              style={[styles.rowBtn, { borderColor: colors.glassBorder, backgroundColor: colors.glassStrong }]}
              onPress={() => setStep("back_cam")}
            >
              <Feather name="rotate-ccw" size={15} color="#FFF" />
              <Text style={[styles.rowBtnTxt, { color: "#FFF" }]}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rowBtn, styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => setStep("name")}
            >
              <Text style={[styles.rowBtnTxt, { color: "#FFF" }]}>Continue</Text>
              <Feather name="arrow-right" size={15} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {step === "name" && (
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.primary },
              (!docName.trim() || saving) && { opacity: 0.5 },
            ]}
            onPress={handleSave}
            disabled={!docName.trim() || saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFF" />
                <Text style={styles.saveBtnTxt}>Save Document</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepInfo: { flex: 1, alignItems: "center" },
  stepLabel: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  stepSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  camOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  modeToggle: {
    position: "absolute",
    top: 16,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 17,
  },
  modeActive: {
    backgroundColor: "rgba(107,142,255,0.8)",
  },
  modeTxt: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  camHint: {
    position: "absolute",
    bottom: 20,
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "Inter_400Regular",
  },
  torchBtn: {
    position: "absolute",
    bottom: 20,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  torchActive: {
    backgroundColor: "rgba(255,196,0,0.2)",
    borderColor: "#FFC400",
  },
  previewContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 14,
  },
  previewImage: {
    width: "100%",
    height: "82%",
    borderRadius: 12,
  },
  previewBadge: {
    backgroundColor: "rgba(107,142,255,0.18)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(107,142,255,0.4)",
  },
  previewBadgeTxt: {
    color: "#6B8EFF",
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    fontFamily: "Inter_700Bold",
  },
  nameContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 32,
    gap: 10,
  },
  nameTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  nameSub: {
    fontSize: 14,
    marginBottom: 6,
    fontFamily: "Inter_400Regular",
  },
  nameInput: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  catLabel: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  catList: {
    gap: 8,
    paddingVertical: 4,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipTxt: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  controls: {
    paddingHorizontal: 24,
    paddingTop: 14,
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 3,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF",
  },
  rowBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  rowBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
  },
  primaryBtn: { flex: 1.5, borderWidth: 0 },
  rowBtnTxt: {
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  saveBtnTxt: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  permTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginTop: 12,
  },
  permBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  permBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  permBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
