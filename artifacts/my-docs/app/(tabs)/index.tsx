import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DocumentCard } from "@/components/DocumentCard";
import { SearchBar } from "@/components/SearchBar";
import { useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const PADDING = 16;
const GAP = 10;
const CARD_W = (SCREEN_W - PADDING * 2 - GAP) / 2;

function FavoriteCard({ doc }: { doc: ReturnType<typeof useDocuments>["documents"][0] }) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/document/${doc.id}`);
        }}
        style={[styles.favCard, { borderColor: "rgba(255,196,0,0.35)" }]}
      >
        <Image
          source={{ uri: doc.frontImageUri }}
          style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.favStar}>
          <Ionicons name="star" size={10} color="#FFC400" />
        </View>
        <Text style={styles.favName} numberOfLines={1}>
          {doc.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { documents, isLoading } = useDocuments();
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const favorites = useMemo(
    () => documents.filter((d) => d.isFavorite),
    [documents]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) => d.name.toLowerCase().includes(q));
  }, [documents, search]);

  const renderItem = ({
    item,
    index,
  }: {
    item: (typeof filtered)[0];
    index: number;
  }) => (
    <View style={{ marginLeft: index % 2 === 0 ? 0 : GAP }}>
      <DocumentCard document={item} width={CARD_W} />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient colors={["#0D0D1C", "#08080F"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.glow, { backgroundColor: colors.primary }]} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>My Docs</Text>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.glassStrong, borderColor: colors.glassBorder }]}
            onPress={() => router.push("/settings")}
          >
            <Feather name="settings" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad + 110 },
          ]}
          ListHeaderComponent={
            favorites.length > 0 && !search ? (
              <View style={styles.favSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="star" size={14} color="#FFC400" />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Favorites
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.favRow}
                >
                  {favorites.map((doc) => (
                    <FavoriteCard key={doc.id} doc={doc} />
                  ))}
                </ScrollView>
                <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
                {documents.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <Ionicons name="documents-outline" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                      All Documents
                    </Text>
                  </View>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              {search.length > 0 ? (
                <>
                  <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                    No results
                  </Text>
                  <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                    Nothing matches "{search}"
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="documents-outline" size={56} color={colors.mutedForeground} />
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                    No documents yet
                  </Text>
                  <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                    Tap the Scan button to capture your first document or card
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad + 24 }]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/scanner");
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="scan" size={20} color="#FFF" />
        <Text style={styles.fabTxt}>Scan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: {
    position: "absolute",
    top: -180,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.08,
    transform: [{ scaleX: 1.4 }],
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  count: {
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
  listContent: {
    paddingHorizontal: PADDING,
    paddingTop: 6,
  },
  favSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  favRow: {
    gap: 10,
    paddingBottom: 4,
  },
  favCard: {
    width: 120,
    height: 77,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  favStar: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 5,
    padding: 3,
  },
  favName: {
    position: "absolute",
    bottom: 6,
    left: 7,
    right: 7,
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
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
  fab: {
    position: "absolute",
    right: 20,
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
  fabTxt: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
