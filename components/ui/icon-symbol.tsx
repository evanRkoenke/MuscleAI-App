// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "camera.fill": "camera-alt",
  "fork.knife": "restaurant",
  "chart.bar.fill": "bar-chart",
  "chart.line.uptrend.xyaxis": "trending-up",
  "gearshape.fill": "settings",
  "person.fill": "person",
  "lock.fill": "lock",
  "star.fill": "star",
  "bolt.fill": "flash-on",
  "bubble.left.fill": "chat",
  "square.and.arrow.up": "share",
  "plus": "add",
  "xmark": "close",
  "arrow.left": "arrow-back",
  "checkmark": "check",
  "magnifyingglass": "search",
  "info.circle": "info",
  "exclamationmark.triangle": "warning",
  "heart.fill": "favorite",
  "scalemass.fill": "fitness-center",
  "flame.fill": "local-fire-department",
  "trash.fill": "delete",
  "pencil": "edit",
  "minus.circle.fill": "remove-circle",
  "questionmark.circle": "help-outline",
  "arrow.triangle.2.circlepath": "sync",
  "checkmark.circle.fill": "check-circle",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
