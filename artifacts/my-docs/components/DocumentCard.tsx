import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
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

import { Document, useDocuments } from "@/context/DocumentContext";
import { useColors } from "@/hooks/useColors";

interface DocumentCardProps {
  document: Document;
  width: number;
}

export function DocumentCard({ document, width }: DocumentCardProps) {
  const colors = useColors();
  const { deleteDocument, renameDocument } = useDocuments();
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
    Alert.alert(document.name, "What would you like to do?", [
      {
        text: "Rename",
        onPress: () => {
          Alert.prompt(
            "Rename Document",
            "Enter a new name",
            (text) => {
              if (text?.trim()) renameDocument(document.id, text.trim());
            },
            "plain-text",
            document.name
          );
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete Document",
            `Delete "${document.name}"? This cannot be undone.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteDocument(document.id),
              },
            ]
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

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
            borderColor: colors.glassBorder,
          },
        ]}
      >
        <Image
          source={{ uri: document.frontImageUri }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: colors.radius },
          ]}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: colors.radius },
          ]}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.label}>
          <Text style={styles.name} numberOfLines={1}>
            {document.name}
          </Text>
          <View style={styles.flipHint}>
            <Ionicons name="sync" size={10} color="rgba(255,255,255,0.5)" />
          </View>
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
  label: {
    position: "absolute",
    bottom: 10,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600" as const,
    flex: 1,
    fontFamily: "Inter_600SemiBold",
  },
  flipHint: {
    marginLeft: 6,
  },
});
