import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PinPad } from "@/components/PinPad";
import { usePin } from "@/context/PinContext";
import { useColors } from "@/hooks/useColors";

export default function PinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { verifyPin, unlock } = usePin();
  const [error, setError] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleComplete = async (pin: string) => {
    const ok = await verifyPin(pin);
    if (ok) {
      unlock();
      router.replace("/");
    } else {
      setError(true);
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={["#0D0D1A", "#08080F"]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.content,
          { paddingTop: topPad + 40, paddingBottom: bottomPad + 20 },
        ]}
      >
        <View style={[styles.logoWrap, { backgroundColor: "rgba(107,142,255,0.12)", borderColor: "rgba(107,142,255,0.25)" }]}>
          <Ionicons name="lock-closed" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          My Docs by NM
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your PIN to continue
        </Text>

        <View style={styles.padWrapper}>
          <PinPad
            onComplete={handleComplete}
            error={error}
            subtitle={error ? "Incorrect PIN. Try again." : undefined}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 48,
  },
  padWrapper: {
    width: "100%",
    alignItems: "center",
  },
});
