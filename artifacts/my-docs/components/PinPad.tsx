import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

const PIN_LENGTH = 4;
const DIGITS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

interface PinPadProps {
  onComplete: (pin: string) => void;
  onError?: () => void;
  error?: boolean;
  subtitle?: string;
}

export function PinPad({ onComplete, error, subtitle }: PinPadProps) {
  const colors = useColors();
  const [pin, setPin] = useState("");
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
  };

  React.useEffect(() => {
    if (error) {
      shake();
      setPin("");
    }
  }, [error]);

  const handleDigit = (digit: string) => {
    if (digit === "⌫") {
      setPin((p) => p.slice(0, -1));
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      return;
    }
    if (digit === "") return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        onComplete(next);
        setPin("");
      }, 100);
    }
  };

  return (
    <View style={styles.container}>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      )}

      <Animated.View style={[styles.dots, shakeStyle]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < pin.length ? colors.primary : "transparent",
                borderColor:
                  i < pin.length ? colors.primary : colors.glassBorder,
              },
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.grid}>
        {DIGITS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((digit, ci) => (
              <TouchableOpacity
                key={ci}
                style={[
                  styles.key,
                  {
                    backgroundColor:
                      digit === ""
                        ? "transparent"
                        : "rgba(255,255,255,0.07)",
                    borderColor:
                      digit === "" ? "transparent" : colors.glassBorder,
                  },
                ]}
                onPress={() => handleDigit(digit)}
                activeOpacity={digit === "" ? 1 : 0.6}
              >
                <Text
                  style={[
                    styles.keyText,
                    {
                      color:
                        digit === "⌫"
                          ? colors.mutedForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {digit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 28,
    fontFamily: "Inter_400Regular",
  },
  dots: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 40,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  grid: {
    gap: 12,
    width: 280,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  key: {
    flex: 1,
    height: 68,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontSize: 22,
    fontWeight: "500" as const,
    fontFamily: "Inter_500Medium",
  },
});
