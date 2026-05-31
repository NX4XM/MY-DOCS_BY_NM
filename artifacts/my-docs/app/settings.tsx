import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useDocuments } from "@/context/DocumentContext";
import { usePin } from "@/context/PinContext";
import { useColors } from "@/hooks/useColors";

function AboutCard() {
  const colors = useColors();
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800 }),
        withTiming(0.4, { duration: 1800 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.aboutWrapper}>
      <Animated.View style={[styles.aboutGlow, glowStyle]} />
      <GlassCard style={styles.aboutCard} borderRadius={20}>
        <View style={styles.aboutInner}>
          <View style={[styles.aboutLogo, { backgroundColor: "rgba(107,142,255,0.12)", borderColor: "rgba(107,142,255,0.25)" }]}>
            <Ionicons name="documents" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.aboutApp, { color: colors.foreground }]}>My Docs by NM</Text>
          <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>
            Version 1.0.0
          </Text>
          <View style={styles.madeWithRow}>
            <Text style={[styles.madeWith, { color: colors.mutedForeground }]}>
              Made with love{" "}
            </Text>
            <Text style={styles.heartTxt}>Noor@NM</Text>
            <Text style={styles.heartEmoji}>❤️</Text>
            <Text style={styles.heartTxt}>S</Text>
          </View>
          <View style={[styles.aboutBadge, { backgroundColor: "rgba(107,142,255,0.12)", borderColor: "rgba(107,142,255,0.25)" }]}>
            <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
            <Text style={[styles.aboutBadgeTxt, { color: colors.primary }]}>
              100% Offline · No Cloud · No Login
            </Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPinEnabled, removePin, lock } = usePin();
  const { documents, deleteDocument, exportBackup, importBackup } = useDocuments();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePinToggle = async (val: boolean) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      router.push("/pin-setup");
    } else {
      Alert.alert("Disable PIN", "Disable PIN protection?", [
        { text: "Cancel", style: "cancel" },
        { text: "Disable", style: "destructive", onPress: removePin },
      ]);
    }
  };

  const handleDeleteAll = () => {
    if (documents.length === 0) return;
    Alert.alert(
      "Delete All",
      `Permanently delete all ${documents.length} document(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            for (const doc of documents) {
              await deleteDocument(doc.id);
            }
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={["#0D0D1C", "#08080F"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Security */}
        <SectionLabel label="SECURITY" colors={colors} />
        <GlassCard style={styles.card}>
          <SettingsRow
            icon="lock-closed"
            iconColor={colors.primary}
            iconBg="rgba(107,142,255,0.14)"
            title="PIN Lock"
            subtitle="Require PIN to open app"
            right={
              <Switch
                value={isPinEnabled}
                onValueChange={handlePinToggle}
                thumbColor="#FFF"
                trackColor={{ false: colors.glassBorder, true: colors.primary }}
              />
            }
            colors={colors}
          />
          {isPinEnabled && (
            <>
              <Divider colors={colors} />
              <SettingsRow
                icon="key-outline"
                iconColor={colors.accent}
                iconBg="rgba(155,111,255,0.14)"
                title="Change PIN"
                subtitle="Update your security PIN"
                onPress={() => router.push("/pin-setup")}
                arrow
                colors={colors}
              />
              <Divider colors={colors} />
              <SettingsRow
                icon="lock-closed-outline"
                iconColor={colors.destructive}
                iconBg="rgba(255,77,77,0.1)"
                title="Lock Now"
                subtitle="Lock the app immediately"
                onPress={() => { lock(); router.replace("/pin"); }}
                arrow
                colors={colors}
                titleColor={colors.destructive}
              />
            </>
          )}
        </GlassCard>

        {/* Backup */}
        <SectionLabel label="BACKUP" colors={colors} />
        <GlassCard style={styles.card}>
          <SettingsRow
            icon="download-outline"
            iconColor={colors.primary}
            iconBg="rgba(107,142,255,0.14)"
            title="Export Backup"
            subtitle="Save all documents to a backup file"
            onPress={exportBackup}
            arrow
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingsRow
            icon="cloud-upload-outline"
            iconColor={colors.accent}
            iconBg="rgba(155,111,255,0.14)"
            title="Restore Backup"
            subtitle="Import documents from a backup file"
            onPress={importBackup}
            arrow
            colors={colors}
          />
        </GlassCard>

        {/* Storage */}
        <SectionLabel label="STORAGE" colors={colors} />
        <GlassCard style={styles.card}>
          <SettingsRow
            icon="folder-outline"
            iconColor={colors.primary}
            iconBg="rgba(107,142,255,0.14)"
            title="Documents Stored"
            subtitle={`${documents.length} document${documents.length !== 1 ? "s" : ""} on this device`}
            colors={colors}
          />
          {documents.length > 0 && (
            <>
              <Divider colors={colors} />
              <SettingsRow
                icon="trash-outline"
                iconColor={colors.destructive}
                iconBg="rgba(255,77,77,0.1)"
                title="Delete All"
                subtitle="Permanently remove all saved data"
                onPress={handleDeleteAll}
                arrow
                titleColor={colors.destructive}
                colors={colors}
              />
            </>
          )}
        </GlassCard>

        {/* About */}
        <SectionLabel label="ABOUT" colors={colors} />
        <AboutCard />
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
      {label}
    </Text>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function SettingsRow({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  right,
  onPress,
  arrow,
  titleColor,
  colors,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  onPress?: () => void;
  arrow?: boolean;
  titleColor?: string;
  colors: ReturnType<typeof useColors>;
}) {
  const inner = (
    <View style={styles.rowInner}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={17} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: titleColor ?? colors.foreground }]}>
          {title}
        </Text>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      {right ?? (arrow && (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      ))}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  content: { paddingHorizontal: 16, gap: 6, paddingTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: { padding: 0 },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  // About card
  aboutWrapper: {
    position: "relative",
    marginTop: 4,
  },
  aboutGlow: {
    position: "absolute",
    top: "20%",
    left: "20%",
    right: "20%",
    height: 100,
    backgroundColor: "#6B8EFF",
    borderRadius: 50,
    opacity: 0.12,
  },
  aboutCard: {
    padding: 0,
  },
  aboutInner: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 8,
  },
  aboutLogo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  aboutApp: {
    fontSize: 20,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  aboutVersion: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  madeWithRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  madeWith: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  heartTxt: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#7B9FFF",
  },
  heartEmoji: {
    fontSize: 14,
  },
  aboutBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 8,
  },
  aboutBadgeTxt: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
});
