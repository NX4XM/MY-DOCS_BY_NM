import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
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

import { useColors } from "@/hooks/useColors";

interface FlipCardProps {
  frontUri: string;
  backUri: string;
  name: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_W = SCREEN_WIDTH - 48;
const CARD_H = CARD_W * 0.63;

export function FlipCard({ frontUri, backUri, name }: FlipCardProps) {
  const colors = useColors();
  const [isFlipped, setIsFlipped] = useState(false);
  const progress = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [0, 180]);
    const opacity = interpolate(
      progress.value,
      [0, 0.49, 0.5, 1],
      [1, 1, 0, 0]
    );
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [180, 360]);
    const opacity = interpolate(
      progress.value,
      [0, 0.49, 0.5, 1],
      [0, 0, 1, 1]
    );
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
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const next = isFlipped ? 0 : 1;
    progress.value = withSpring(next, {
      damping: 18,
      stiffness: 95,
      mass: 0.9,
    });
    setIsFlipped(!isFlipped);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleFlip}
        style={[styles.cardContainer, { width: CARD_W, height: CARD_H }]}
      >
        <Animated.View
          style={[
            styles.face,
            {
              width: CARD_W,
              height: CARD_H,
              borderRadius: colors.radius + 4,
              borderColor: colors.glassBorder,
            },
            frontStyle,
          ]}
        >
          <Image
            source={{ uri: frontUri }}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: colors.radius + 4 },
            ]}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.sideTag}>
            <Text style={styles.sideText}>FRONT</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.face,
            {
              width: CARD_W,
              height: CARD_H,
              borderRadius: colors.radius + 4,
              borderColor: colors.glassBorder,
            },
            backStyle,
          ]}
        >
          <Image
            source={{ uri: backUri }}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: colors.radius + 4 },
            ]}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.sideTag}>
            <Text style={styles.sideText}>BACK</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.hint}>
        <Text style={styles.hintText}>
          {isFlipped ? "Showing back · tap to flip" : "Showing front · tap to flip"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cardContainer: {
    position: "relative",
  },
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
  hint: {
    marginTop: 16,
  },
  hintText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
