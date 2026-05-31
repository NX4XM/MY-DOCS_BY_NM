import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
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

import { CATEGORIES, Document, useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

interface DocumentCardProps {
  document: Document;
  width: number;
}

export function DocumentCard({ document, width }: DocumentCardProps) {
  const colors = useColors();
  const { deleteDocument, renameDocument, toggleFavorite } = useDocuments();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/document/${document.id}`);
  };

  const handleLongPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(document.name, "Choose an action", [
      {
        text: document.isFavorite ? "Remove from Favorites" : "Add to Favorites",
        onPress: () => toggleFavorite(document.id),
      },
      {
        text: "Rename",
        onPress: () => {
          Alert.prompt(
            "Rename",
            "Enter a new name",
            (text) => { if (text?.trim()) renameDocument(document.id, text.trim()); },
            "plain-text",
            document.name
          );
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Delete", `Delete "${document.name}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteDocument(document.id) },
          ]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const categoryLabel = CATEGORIES.find((c) => c.key === document.category)?.label ?? "";
  const cardHeight = width * 0.64;

  return (
    <Animated.View style={[animStyle, { width, marginBottom: 12 }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            width,
            height: cardHeight,
            borderRadius: colors.radius,
            borderColor: document.isFavorite
              ? "rgba(255, 196, 0, 0.4)"
              : colors.glassBorder,
          },
        ]}
      >
        <Image
          source={{ uri: document.frontImageUri }}
          style={[StyleSheet.absoluteFill, { borderRadius: colors.radius }]}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.88)"]}
          style={[StyleSheet.absoluteFill, { borderRadius: colors.radius }]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Category chip */}
        {categoryLabel ? (
          <View style={styles.categoryChip}>
            <Text style={styles.categoryText}>{categoryLabel}</Text>
          </View>
        ) : null}

        {/* Favorite star */}
        {document.isFavorite && (
          <View style={styles.starBadge}>
            <Ionicons name="star" size={11} color="#FFC400" />
          </View>
        )}

        {/* Name */}
        <View style={styles.label}>
          <Text style={styles.name} numberOfLines={1}>
            {document.name}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  categoryChip: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  categoryText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 9,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    fontFamily: "Inter_600SemiBold",
  },
  starBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    padding: 4,
  },
  label: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
