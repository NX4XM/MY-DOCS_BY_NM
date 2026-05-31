import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";

interface Corner {
  x: number;
  y: number;
}
type CornerKey = "tl" | "tr" | "bl" | "br";

interface CropViewProps {
  uri: string;
  origW: number;
  origH: number;
  onCropped: (uri: string) => void;
  onSkip: () => void;
}

const HANDLE = 30;

export function CropView({ uri, origW, origH, onCropped, onSkip }: CropViewProps) {
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [processing, setProcessing] = useState(false);
  const [, forceUpdate] = useState(0);

  const layoutRef = useRef({ dispW: 0, dispH: 0, offsetX: 0, offsetY: 0 });

  const cornerPositions = useRef<Record<CornerKey, Corner>>({
    tl: { x: 0, y: 0 },
    tr: { x: 100, y: 0 },
    bl: { x: 0, y: 100 },
    br: { x: 100, y: 100 },
  });

  const initCorners = (dispW: number, dispH: number, offsetX: number, offsetY: number) => {
    const PAD = 24;
    cornerPositions.current = {
      tl: { x: offsetX + PAD, y: offsetY + PAD },
      tr: { x: offsetX + dispW - PAD, y: offsetY + PAD },
      bl: { x: offsetX + PAD, y: offsetY + dispH - PAD },
      br: { x: offsetX + dispW - PAD, y: offsetY + dispH - PAD },
    };
    forceUpdate((n) => n + 1);
  };

  useEffect(() => {
    if (containerSize.w === 0 || origW === 0) return;
    const scale = Math.min(containerSize.w / origW, containerSize.h / origH);
    const dispW = origW * scale;
    const dispH = origH * scale;
    const offsetX = (containerSize.w - dispW) / 2;
    const offsetY = (containerSize.h - dispH) / 2;
    layoutRef.current = { dispW, dispH, offsetX, offsetY };
    initCorners(dispW, dispH, offsetX, offsetY);
  }, [containerSize, origW, origH]);

  const initPos = useRef<Record<CornerKey, Corner>>({
    tl: { x: 0, y: 0 },
    tr: { x: 0, y: 0 },
    bl: { x: 0, y: 0 },
    br: { x: 0, y: 0 },
  });

  const makePan = (key: CornerKey) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        initPos.current[key] = { ...cornerPositions.current[key] };
      },
      onPanResponderMove: (_, gs) => {
        const { offsetX, offsetY, dispW, dispH } = layoutRef.current;
        const nx = initPos.current[key].x + gs.dx;
        const ny = initPos.current[key].y + gs.dy;
        cornerPositions.current[key] = {
          x: Math.max(offsetX, Math.min(offsetX + dispW, nx)),
          y: Math.max(offsetY, Math.min(offsetY + dispH, ny)),
        };
        forceUpdate((n) => n + 1);
      },
      onPanResponderRelease: () => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
    });

  const panTL = useRef(makePan("tl")).current;
  const panTR = useRef(makePan("tr")).current;
  const panBL = useRef(makePan("bl")).current;
  const panBR = useRef(makePan("br")).current;

  const pans: Record<CornerKey, typeof panTL> = { tl: panTL, tr: panTR, bl: panBL, br: panBR };

  const applyCrop = async () => {
    setProcessing(true);
    try {
      const { offsetX, offsetY, dispW, dispH } = layoutRef.current;
      const cp = cornerPositions.current;
      const allX = (Object.values(cp) as Corner[]).map((c) => c.x - offsetX);
      const allY = (Object.values(cp) as Corner[]).map((c) => c.y - offsetY);
      const minX = Math.max(0, Math.min(...allX));
      const maxX = Math.min(dispW, Math.max(...allX));
      const minY = Math.max(0, Math.min(...allY));
      const maxY = Math.min(dispH, Math.max(...allY));

      const sx = origW / dispW;
      const sy = origH / dispH;
      const cropX = Math.round(minX * sx);
      const cropY = Math.round(minY * sy);
      const cropW = Math.max(100, Math.round((maxX - minX) * sx));
      const cropH = Math.max(100, Math.round((maxY - minY) * sy));

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          { crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } },
          { resize: { width: 1800 } },
        ],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onCropped(result.uri);
    } catch {
      onSkip();
    } finally {
      setProcessing(false);
    }
  };

  const cp = cornerPositions.current;
  const tl = cp.tl;
  const tr = cp.tr;
  const bl = cp.bl;
  const br = cp.br;
  const { w, h } = containerSize;

  const svgPath = w > 0
    ? `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M ${tl.x} ${tl.y} L ${tr.x} ${tr.y} L ${br.x} ${br.y} L ${bl.x} ${bl.y} Z`
    : "";

  return (
    <View style={styles.root}>
      <View
        style={styles.imageArea}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setContainerSize({ w: width, h: height });
        }}
      >
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill]}
          resizeMode="contain"
        />

        {w > 0 && (
          <Svg
            style={StyleSheet.absoluteFill}
            width={w}
            height={h}
            pointerEvents="none"
          >
            <Path d={svgPath} fill="rgba(0,0,0,0.55)" fillRule="evenodd" />
            <Line
              x1={tl.x} y1={tl.y} x2={tr.x} y2={tr.y}
              stroke="#6B8EFF" strokeWidth="2"
            />
            <Line
              x1={tr.x} y1={tr.y} x2={br.x} y2={br.y}
              stroke="#6B8EFF" strokeWidth="2"
            />
            <Line
              x1={br.x} y1={br.y} x2={bl.x} y2={bl.y}
              stroke="#6B8EFF" strokeWidth="2"
            />
            <Line
              x1={bl.x} y1={bl.y} x2={tl.x} y2={tl.y}
              stroke="#6B8EFF" strokeWidth="2"
            />
          </Svg>
        )}

        {(["tl", "tr", "bl", "br"] as CornerKey[]).map((key) => (
          <View
            key={key}
            style={[
              styles.handle,
              {
                left: cp[key].x - HANDLE / 2,
                top: cp[key].y - HANDLE / 2,
              },
            ]}
            {...pans[key].panHandlers}
          >
            <View style={styles.handleInner} />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>Drag corners to align with document edges</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={onSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cropBtn, processing && { opacity: 0.6 }]}
            onPress={applyCrop}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.cropText}>Apply Crop</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  imageArea: {
    flex: 1,
    position: "relative",
  },
  handle: {
    position: "absolute",
    width: HANDLE,
    height: HANDLE,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  handleInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#6B8EFF",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#6B8EFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    gap: 14,
  },
  hint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  skipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  cropBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#6B8EFF",
    alignItems: "center",
  },
  cropText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
  },
});
