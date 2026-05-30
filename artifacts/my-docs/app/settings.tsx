import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useDocuments } from "@/context/DocumentContext";
import { usePin } from "@/context/PinContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPinEnabled, removePin, lock } = usePin();
  const { documents, deleteDocument } = useDocuments();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePinToggle = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (value) {
      router.push("/pin-setup");
    } else {
      Alert.alert(
        "Disable PIN Lock",
        "Are you sure you want to disable PIN protection?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: removePin,
          },
        ]
      );
    }
  };

  const handleChangePin = () => {
    router.push("/pin-setup");
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Delete All Documents",
      `This will permanently delete all ${documents.length} document(s). This cannot be undone.`,
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
        {/* Security section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          SECURITY
        </Text>
        <GlassCard style={styles.card}>
          {/* PIN toggle */}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(107,142,255,0.15)" }]}>
              <Ionicons name="lock-closed" size={16} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                PIN Lock
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Require PIN to open app
              </Text>
            </View>
            <Switch
              value={isPinEnabled}
              onValueChange={handlePinToggle}
              thumbColor="#FFFFFF"
              trackColor={{ false: colors.glassBorder, true: colors.primary }}
            />
          </View>

          {isPinEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.row} onPress={handleChangePin}>
                <View style={[styles.iconWrap, { backgroundColor: "rgba(155,111,255,0.15)" }]}>
                  <Feather name="edit" size={16} color={colors.accent} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                    Change PIN
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                    Update your security PIN
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                style={styles.row}
                onPress={() => {
                  lock();
                  router.replace("/pin");
                }}
              >
                <View style={[styles.iconWrap, { backgroundColor: "rgba(255,77,77,0.12)" }]}>
                  <Feather name="lock" size={16} color={colors.destructive} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.destructive }]}>
                    Lock Now
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                    Lock the app immediately
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </>
          )}
        </GlassCard>

        {/* Storage section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          STORAGE
        </Text>
        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(107,142,255,0.15)" }]}>
              <Feather name="folder" size={16} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                Documents Stored
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {documents.length} document{documents.length !== 1 ? "s" : ""} saved locally
              </Text>
            </View>
          </View>

          {documents.length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.row} onPress={handleDeleteAll}>
                <View style={[styles.iconWrap, { backgroundColor: "rgba(255,77,77,0.12)" }]}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.destructive }]}>
                    Delete All Documents
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                    Permanently remove all saved data
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </>
          )}
        </GlassCard>

        {/* About section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          ABOUT
        </Text>
        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(107,142,255,0.15)" }]}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                My Docs by NM
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Version 1.0.0 · Fully offline
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(107,142,255,0.15)" }]}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                Privacy
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                All data stays on your device. No cloud, no login, no internet required.
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
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
  content: {
    paddingHorizontal: 16,
    gap: 6,
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    padding: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});
