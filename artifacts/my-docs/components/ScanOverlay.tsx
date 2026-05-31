import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_W } = Dimensions.get("window");

const CARD_W = SCREEN_W - 64;
const CARD_H = CARD_W * 0.63;
const A4_W = SCREEN_W - 40;
const A4_H = A4_W * 1.414;

const CORNER = 28;
const THICK = 3;
const COLOR = "#6B8EFF";

function Corner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const isTop = position === "tl" || position === "tr";
  const isLeft = position === "tl" || position === "bl";
  return (
    <View
      style={[
        styles.corner,
        { top: isTop ? 0 : undefined, bottom: isTop ? undefined : 0 },
        { left: isLeft ? 0 : undefined, right: isLeft ? undefined : 0 },
      ]}
    >
      <View
        style={[
          styles.cornerInner,
          { top: isTop ? 0 : undefined, bottom: isTop ? undefined : 0 },
          { left: isLeft ? 0 : undefined, right: isLeft ? undefined : 0 },
          { borderTopWidth: isTop ? THICK : 0 },
          { borderBottomWidth: isTop ? 0 : THICK },
          { borderLeftWidth: isLeft ? THICK : 0 },
          { borderRightWidth: isLeft ? 0 : THICK },
          { borderTopLeftRadius: position === "tl" ? 6 : 0 },
          { borderTopRightRadius: position === "tr" ? 6 : 0 },
          { borderBottomLeftRadius: position === "bl" ? 6 : 0 },
          { borderBottomRightRadius: position === "br" ? 6 : 0 },
          { borderColor: COLOR },
        ]}
      />
    </View>
  );
}

interface ScanOverlayProps {
  mode?: "card" | "a4";
}

export function ScanOverlay({ mode = "card" }: ScanOverlayProps) {
  const scanY = useSharedValue(0);
  const lineOpacity = useSharedValue(0.6);

  const frameW = mode === "a4" ? A4_W : CARD_W;
  const frameH = mode === "a4" ? A4_H : CARD_H;

  useEffect(() => {
    scanY.value = 0;
    scanY.value = withRepeat(
      withSequence(
        withTiming(frameH - 4, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      false
    );
    lineOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.2, { duration: 900 })
      ),
      -1,
      true
    );
  }, [frameH]);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
    opacity: lineOpacity.value,
  }));

  return (
    <View
      style={[
        styles.frame,
        { width: frameW, height: frameH },
      ]}
    >
      <Corner position="tl" />
      <Corner position="tr" />
      <Corner position="bl" />
      <Corner position="br" />
      <Animated.View style={[styles.scanLine, scanStyle, { left: 8, right: 8 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: "relative" },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
  },
  cornerInner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
  },
  scanLine: {
    position: "absolute",
    height: 2,
    borderRadius: 1,
    backgroundColor: COLOR,
    shadowColor: COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 7,
  },
});
