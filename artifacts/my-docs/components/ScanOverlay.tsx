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
const FRAME_W = SCREEN_W - 48;
const FRAME_H = FRAME_W * 0.63;
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = "#6B8EFF";

function Corner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const isTop = position === "tl" || position === "tr";
  const isLeft = position === "tl" || position === "bl";

  return (
    <View
      style={[
        styles.corner,
        {
          top: isTop ? 0 : undefined,
          bottom: isTop ? undefined : 0,
          left: isLeft ? 0 : undefined,
          right: isLeft ? undefined : 0,
        },
      ]}
    >
      <View
        style={[
          styles.cornerH,
          {
            top: isTop ? 0 : undefined,
            bottom: isTop ? undefined : 0,
            left: isLeft ? 0 : undefined,
            right: isLeft ? undefined : 0,
            borderTopWidth: isTop ? CORNER_THICKNESS : 0,
            borderBottomWidth: isTop ? 0 : CORNER_THICKNESS,
            borderLeftWidth: isLeft ? CORNER_THICKNESS : 0,
            borderRightWidth: isLeft ? 0 : CORNER_THICKNESS,
            borderTopLeftRadius: position === "tl" ? 6 : 0,
            borderTopRightRadius: position === "tr" ? 6 : 0,
            borderBottomLeftRadius: position === "bl" ? 6 : 0,
            borderBottomRightRadius: position === "br" ? 6 : 0,
            borderColor: CORNER_COLOR,
          },
        ]}
      />
    </View>
  );
}

export function ScanOverlay() {
  const scannerY = useSharedValue(0);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scannerY.value = withRepeat(
      withSequence(
        withTiming(FRAME_H - 4, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scannerY.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      style={[
        styles.frame,
        { width: FRAME_W, height: FRAME_H },
      ]}
    >
      <Corner position="tl" />
      <Corner position="tr" />
      <Corner position="bl" />
      <Corner position="br" />
      <Animated.View style={[styles.scanLine, scanLineStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerH: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  scanLine: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: CORNER_COLOR,
    shadowColor: CORNER_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});
