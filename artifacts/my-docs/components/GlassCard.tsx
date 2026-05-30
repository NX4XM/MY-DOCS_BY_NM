import { BlurView } from "expo-blur";
import React, { ReactNode } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
}

export function GlassCard({
  children,
  style,
  intensity = 20,
  borderRadius,
}: GlassCardProps) {
  const colors = useColors();
  const radius = borderRadius ?? colors.radius;

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[
          styles.base,
          {
            borderRadius: radius,
            borderColor: colors.glassBorder,
          },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.base,
        {
          borderRadius: radius,
          backgroundColor: colors.glassStrong,
          borderColor: colors.glassBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: "hidden",
  },
});
