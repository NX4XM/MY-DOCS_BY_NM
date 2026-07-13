import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ZoomableImage } from "./ZoomableImage";

import { Category } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

interface FlipCardProps {
  frontUri: string;
  backUri: string;
  name: string;
  category?: Category;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const A4_CATEGORIES: Category[] = ["a4", "passport", "custom"];

function isA4(category?: Category): boolean {
  return !!category && A4_CATEGORIES.includes(category);
}

function cardDimensions(category?: Category): { w: number; h: number } {
  const cardW = SCREEN_WIDTH - 48;
  if (isA4(category)) {
    const h = Math.min(cardW * 1.414, SCREEN_HEIGHT * 0.55);
    const w = h / 1.414;
    return { w, h };
  }
  return { w: cardW, h: cardW * 0.63 };
}

function ImagePreviewModal({
  uri,
  side,
  visible,
  onClose,
}: {
  uri: string;
  side: "FRONT" | "BACK";
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={preview.overlay}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.97)" />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={preview.tag}>
          <Text style={preview.tagTxt}>{side}</Text>
        </View>
        <ZoomableImage uri={uri} />
        <TouchableOpacity style={preview.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={preview.closeTxt}>✕  Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export function FlipCard({ frontUri, backUri, name, category }: FlipCardProps) {
  const colors = useColors();
  const [isFlipped, setIsFlipped] = useState(false);
  const [previewSide, setPreviewSide] = useState<"FRONT" | "BACK" | null>(null);
  const progress = useSharedValue(0);

  const { w: cardW, h: cardH } = cardDimensions(category);
  const radius = isA4(category) ? 8 : colors.radius + 4;

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [0, 180]);
    const opacity = interpolate(progress.value, [0, 0.49, 0.5, 1], [1, 1, 0, 0]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [180, 360]);
    const opacity = interpolate(progress.value, [0, 0.49, 0.5, 1], [0, 0, 1, 1]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      opacity,
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  const handleFlip = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = isFlipped ? 0 : 1;
    progress.value = withSpring(next, { damping: 18, stiffness: 95, mass: 0.9 });
    setIsFlipped((v) => !v);
  };

  const handleLongPress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPreviewSide(isFlipped ? "BACK" : "FRONT");
  };

  return (
    <View style={styles.wrapper}>
      {/* Single touchable — tap = flip, long-press = fullscreen preview */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleFlip}
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={[styles.cardContainer, { width: cardW, height: cardH }]}
      >
        {/* Front face */}
        <Animated.View
          style={[
            styles.face,
            { width: cardW, height: cardH, borderRadius: radius, borderColor: colors.glassBorder },
            frontStyle,
          ]}
        >
          <Image
            source={{ uri: frontUri }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.sideTag}>
            <Text style={styles.sideText}>FRONT</Text>
          </View>
        </Animated.View>

        {/* Back face */}
        <Animated.View
          style={[
            styles.face,
            { width: cardW, height: cardH, borderRadius: radius, borderColor: colors.glassBorder },
            backStyle,
          ]}
        >
          <Image
            source={{ uri: backUri }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.sideTag}>
            <Text style={styles.sideText}>BACK</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.hintRow}>
        <Text style={styles.hintText}>
          {isFlipped ? "Back · tap to flip" : "Front · tap to flip"}
        </Text>
        <Text style={styles.hintSep}>·</Text>
        <Text style={styles.hintText}>hold to expand</Text>
      </View>

      <ImagePreviewModal
        visible={previewSide !== null}
        uri={previewSide === "FRONT" ? frontUri : backUri}
        side={previewSide ?? "FRONT"}
        onClose={() => setPreviewSide(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", paddingVertical: 8 },
  cardContainer: { position: "relative" },
  face: {
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  sideTag: {
    position: "absolute",
    top: 12,
    left: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sideText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    fontFamily: "Inter_700Bold",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  hintSep: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 12,
  },
  hintText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

const preview = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.97)",
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(107,142,255,0.2)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(107,142,255,0.4)",
    zIndex: 10,
  },
  tagTxt: {
    color: "#6B8EFF",
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 1.5,
    fontFamily: "Inter_700Bold",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.78,
  },
  closeBtn: {
    position: "absolute",
    bottom: 52,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  closeTxt: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
