import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PinPad } from "@/components/PinPad";
import { usePin } from "@/context/PinContext";
import { useColors } from "@/hooks/useColors";

type SetupStep = "enter" | "confirm";

export default function PinSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setPin } = usePin();
  const [step, setStep] = useState<SetupStep>("enter");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleFirst = (pin: string) => {
    setFirstPin(pin);
    setStep("confirm");
  };

  const handleConfirm = async (pin: string) => {
    if (pin === firstPin) {
      await setPin(pin);
      router.back();
    } else {
      setError(true);
      setTimeout(() => {
        setError(false);
        setStep("enter");
        setFirstPin("");
      }, 800);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={["#0D0D1A", "#08080F"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}
          onPress={() => router.back()}
        >
          <Feather name="x" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { paddingBottom: bottomPad + 20 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {step === "enter" ? "Set PIN" : "Confirm PIN"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {step === "enter"
            ? "Choose a 4-digit PIN to protect your documents"
            : "Enter the same PIN again to confirm"}
        </Text>

        <View style={styles.padWrapper}>
          <PinPad
            key={step}
            onComplete={step === "enter" ? handleFirst : handleConfirm}
            error={error}
            subtitle={error ? "PINs don't match. Try again." : undefined}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 20,
  },
  padWrapper: {
    width: "100%",
    alignItems: "center",
  },
});
