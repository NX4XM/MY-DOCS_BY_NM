import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DocumentCard } from "@/components/DocumentCard";
import { SearchBar } from "@/components/SearchBar";
import { useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const GRID_PADDING = 16;
const GRID_GAP = 12;
const CARD_W = (SCREEN_W - GRID_PADDING * 2 - GRID_GAP) / 2;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { documents, isLoading } = useDocuments();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) => d.name.toLowerCase().includes(q));
  }, [documents, search]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const renderItem = ({ item, index }: { item: (typeof filtered)[0]; index: number }) => {
    const isLeft = index % 2 === 0;
    return (
      <View style={{ marginLeft: isLeft ? 0 : GRID_GAP }}>
        <DocumentCard document={item} width={CARD_W} />
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background gradient */}
      <LinearGradient
        colors={["#0D0D1A", "#08080F"]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.glow,
          { backgroundColor: colors.primary, opacity: 0.08 },
        ]}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12 },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              My Docs
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.settingsBtn,
              { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder },
            ]}
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrapper}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          {search.length > 0 ? (
            <>
              <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No results
              </Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                No documents matching "{search}"
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="documents-outline" size={56} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No documents yet
              </Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Tap the button below to scan your first document or card
              </Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: bottomPad + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={filtered.length > 0}
        />
      )}

      {/* FAB */}
      <View
        style={[
          styles.fabWrapper,
          { bottom: bottomPad + 24 },
        ]}
      >
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            router.push("/scanner");
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="scan" size={22} color="#FFFFFF" />
          <Text style={styles.fabText}>Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    top: -200,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    transform: [{ scaleX: 1.5 }],
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  searchWrapper: {
    marginBottom: 4,
  },
  grid: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  fabWrapper: {
    position: "absolute",
    right: 20,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    shadowColor: "#6B8EFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
