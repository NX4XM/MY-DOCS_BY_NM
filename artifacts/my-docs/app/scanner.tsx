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
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScanOverlay } from "@/components/ScanOverlay";
import { useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

type Step = "front" | "frontPreview" | "back" | "backPreview" | "name";

export default function ScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addDocument } = useDocuments();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<Step>("front");
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const enhanceImage = async (uri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1800 } }],
        {
          compress: 0.92,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch {
      return uri;
    }
  };

  const capture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
      });
      if (!photo) return;
      const enhanced = await enhanceImage(photo.uri);
      if (step === "front") {
        setFrontUri(enhanced);
        setStep("frontPreview");
      } else {
        setBackUri(enhanced);
        setStep("backPreview");
      }
    } catch {
      Alert.alert("Error", "Failed to capture photo. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const handleSave = async () => {
    if (!frontUri || !backUri || !docName.trim()) return;
    setSaving(true);
    try {
      await addDocument(docName.trim(), frontUri, backUri);
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

  const stepLabel = {
    front: "Scan Front Side",
    frontPreview: "Front Preview",
    back: "Scan Back Side",
    backPreview: "Back Preview",
    name: "Name Document",
  }[step];

  const stepNum = {
    front: 1,
    frontPreview: 1,
    back: 2,
    backPreview: 2,
    name: 3,
  }[step];

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
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
          <Text style={styles.permBtnText}>Allow Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showCamera = step === "front" || step === "back";

  return (
    <View style={[styles.root, { backgroundColor: "#000000" }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}
          onPress={() => router.back()}
        >
          <Feather name="x" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.stepInfo}>
          <Text style={styles.stepLabel}>{stepLabel}</Text>
          <Text style={styles.stepNum}>Step {stepNum} of 3</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Camera / Preview area */}
      {showCamera ? (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
          />
          <View style={styles.overlay}>
            <LinearGradient
              colors={["rgba(0,0,0,0.5)", "transparent", "transparent", "rgba(0,0,0,0.5)"]}
              style={StyleSheet.absoluteFill}
            />
            <ScanOverlay />
            <Text style={styles.overlayHint}>
              Position the {step === "front" ? "front" : "back"} of your document within the frame
            </Text>
          </View>
        </View>
      ) : step === "name" ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.nameContainer}
        >
          <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
          <Text style={styles.nameTitle}>Almost done!</Text>
          <Text style={[styles.nameSubtitle, { color: colors.mutedForeground }]}>
            Give this document a name
          </Text>
          <TextInput
            value={docName}
            onChangeText={setDocName}
            placeholder="e.g. Passport, ID Card, License..."
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
            onSubmitEditing={handleSave}
            maxLength={50}
          />
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.previewContainer}>
          {(step === "frontPreview" ? frontUri : backUri) && (
            <Image
              source={{ uri: (step === "frontPreview" ? frontUri : backUri)! }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>
              {step === "frontPreview" ? "FRONT" : "BACK"} CAPTURED
            </Text>
          </View>
        </View>
      )}

      {/* Bottom controls */}
      <View
        style={[
          styles.controls,
          { paddingBottom: bottomPad + 16 },
        ]}
      >
        {showCamera && (
          <TouchableOpacity
            style={[
              styles.captureBtn,
              capturing && { opacity: 0.6 },
            ]}
            onPress={capture}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
        )}

        {step === "frontPreview" && (
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.glassBorder, backgroundColor: colors.glassStrong }]}
              onPress={() => setStep("front")}
            >
              <Feather name="rotate-ccw" size={16} color={colors.foreground} />
              <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => setStep("back")}
            >
              <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>Scan Back</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {step === "backPreview" && (
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.glassBorder, backgroundColor: colors.glassStrong }]}
              onPress={() => setStep("back")}
            >
              <Feather name="rotate-ccw" size={16} color={colors.foreground} />
              <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => setStep("name")}
            >
              <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>Continue</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" />
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
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Document</Text>
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
    paddingBottom: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  stepInfo: {
    flex: 1,
    alignItems: "center",
  },
  stepLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  stepNum: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  overlayHint: {
    position: "absolute",
    bottom: 24,
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "Inter_400Regular",
  },
  previewContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  previewImage: {
    width: "100%",
    height: "80%",
    borderRadius: 12,
  },
  previewBadge: {
    marginTop: 16,
    backgroundColor: "rgba(107,142,255,0.2)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(107,142,255,0.4)",
  },
  previewBadgeText: {
    color: "#6B8EFF",
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    fontFamily: "Inter_700Bold",
  },
  nameContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  nameTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  nameSubtitle: {
    fontSize: 14,
    marginBottom: 8,
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
  controls: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  primaryBtn: {
    flex: 1.5,
    borderWidth: 0,
  },
  actionBtnText: {
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
  saveBtnText: {
    color: "#FFFFFF",
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
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
