import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FlipCard } from "@/components/FlipCard";
import { GlassCard } from "@/components/GlassCard";
import { CATEGORIES, useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { documents, deleteDocument, renameDocument, toggleFavorite, updateDocumentImage } =
    useDocuments();

  const doc = documents.find((d) => d.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!doc) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, fontFamily: "Inter_400Regular" }}>
          Document not found
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 12, fontFamily: "Inter_400Regular" }}>
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryLabel =
    CATEGORIES.find((c) => c.key === doc.category)?.label ?? "Document";

  const handleRename = () => {
    Alert.prompt(
      "Rename",
      "Enter new name",
      (t) => { if (t?.trim()) renameDocument(doc.id, t.trim()); },
      "plain-text",
      doc.name
    );
  };

  const handleDelete = () => {
    Alert.alert("Delete", `Delete "${doc.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => { deleteDocument(doc.id); router.back(); },
      },
    ]);
  };

  const handleFavorite = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(doc.id);
  };

  const handleReplaceImage = async (side: "front" | "back") => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.92,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    await updateDocumentImage(doc.id, side, result.assets[0].uri);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleMoreMenu = () => {
    Alert.alert(doc.name, "Choose an action", [
      { text: "Rename", onPress: handleRename },
      { text: `Replace Front Image`, onPress: () => handleReplaceImage("front") },
      { text: `Replace Back Image`, onPress: () => handleReplaceImage("back") },
      { text: "Delete", style: "destructive", onPress: handleDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {doc.name}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}
            onPress={handleFavorite}
          >
            <Ionicons
              name={doc.isFavorite ? "star" : "star-outline"}
              size={17}
              color={doc.isFavorite ? "#FFC400" : colors.mutedForeground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}
            onPress={handleMoreMenu}
          >
            <Feather name="more-horizontal" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 3D Flip Card */}
        <FlipCard frontUri={doc.frontImageUri} backUri={doc.backImageUri} name={doc.name} />

        {/* Info */}
        <GlassCard style={styles.infoCard}>
          <InfoRow icon="file-text" label="Name" value={doc.name} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow icon="tag" label="Type" value={categoryLabel} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow icon="calendar" label="Saved" value={formatDate(doc.createdAt)} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <InfoRow icon="layers" label="Sides" value="Front + Back" colors={colors} />
        </GlassCard>

        {/* Actions */}
        <View style={styles.actionsGrid}>
          <ActionBtn
            icon="edit-2"
            label="Rename"
            color={colors.foreground}
            bg={colors.glassStrong}
            border={colors.glassBorder}
            onPress={handleRename}
          />
          <ActionBtn
            icon="image"
            label="Front"
            color={colors.foreground}
            bg={colors.glassStrong}
            border={colors.glassBorder}
            onPress={() => handleReplaceImage("front")}
          />
          <ActionBtn
            icon="image"
            label="Back"
            color={colors.foreground}
            bg={colors.glassStrong}
            border={colors.glassBorder}
            onPress={() => handleReplaceImage("back")}
          />
          <ActionBtn
            icon="trash-2"
            label="Delete"
            color={colors.destructive}
            bg="rgba(255,77,77,0.08)"
            border="rgba(255,77,77,0.25)"
            onPress={handleDelete}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon as any} size={14} color={colors.mutedForeground} />
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  bg,
  border,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: bg, borderColor: border }]}
      onPress={onPress}
    >
      <Feather name={icon as any} size={16} color={color} />
      <Text style={[styles.actionTxt, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
  },
  infoCard: { padding: 0 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minWidth: "44%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
  },
  actionTxt: {
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
