import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
import { useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { documents, deleteDocument, renameDocument } = useDocuments();

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

  const handleRename = () => {
    Alert.prompt(
      "Rename Document",
      "Enter a new name",
      (text) => {
        if (text?.trim()) renameDocument(doc.id, text.trim());
      },
      "plain-text",
      doc.name
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Document",
      `Delete "${doc.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteDocument(doc.id);
            router.back();
          },
        },
      ]
    );
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {doc.name}
        </Text>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}
          onPress={() => {
            Alert.alert(doc.name, "Choose an action", [
              { text: "Rename", onPress: handleRename },
              {
                text: "Delete",
                style: "destructive",
                onPress: handleDelete,
              },
              { text: "Cancel", style: "cancel" },
            ]);
          }}
        >
          <Feather name="more-horizontal" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Flip card */}
        <FlipCard
          frontUri={doc.frontImageUri}
          backUri={doc.backImageUri}
          name={doc.name}
        />

        {/* Info card */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="file-text" size={15} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Document Name
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {doc.name}
              </Text>
            </View>
          </View>
          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
          />
          <View style={styles.infoRow}>
            <Feather name="calendar" size={15} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Saved On
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {formatDate(doc.createdAt)}
              </Text>
            </View>
          </View>
          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
          />
          <View style={styles.infoRow}>
            <Feather name="layers" size={15} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Sides
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                Front + Back
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder },
            ]}
            onPress={handleRename}
          >
            <Feather name="edit-2" size={16} color={colors.foreground} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>
              Rename
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              { backgroundColor: "rgba(255,77,77,0.1)", borderColor: "rgba(255,77,77,0.3)" },
            ]}
            onPress={handleDelete}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.actionText, { color: colors.destructive }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  infoCard: {
    padding: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
