import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  initialValue: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function RenameModal({ visible, initialValue, onConfirm, onCancel }: Props) {
  const colors = useColors();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      // small delay so modal finishes mounting before focusing
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [visible, initialValue]);

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    onConfirm(trimmed);
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.glassStrong,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            Rename Document
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enter a new name
          </Text>

          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={setValue}
            placeholder="Document name…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderColor: colors.border,
              },
            ]}
          />

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.05)" }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnTxt, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnPrimary,
                { backgroundColor: colors.primary },
                !value.trim() && { opacity: 0.45 },
              ]}
              onPress={handleConfirm}
              disabled={!value.trim()}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnTxt, { color: "#FFF" }]}>Rename</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  sheet: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    borderWidth: 0,
  },
  btnTxt: {
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
