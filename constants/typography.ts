import { Platform } from "react-native";

/**
 * Typography system using SF Pro Display / system San Francisco font.
 *
 * On iOS, the system font IS San Francisco (SF Pro), so we use "System" which
 * maps to SF Pro automatically. On Android, we use the system default sans-serif.
 * On web, we use the SF Pro Display CSS font stack with system fallbacks.
 *
 * Weight hierarchy:
 * - Headings (h1-h3): Bold (700)
 * - Subheadings: Semibold (600)
 * - Body: Regular (400)
 * - Caption: Regular (400)
 */

const FONT_FAMILY = Platform.select({
  ios: "System",
  android: "sans-serif",
  web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  default: "System",
});

const FONT_FAMILY_BOLD = Platform.select({
  ios: "System",
  android: "sans-serif",
  web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  default: "System",
});

export const Typography = {
  fontFamily: FONT_FAMILY,
  fontFamilyBold: FONT_FAMILY_BOLD,

  // Heading styles - Bold (700)
  h1: {
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 34,
    fontWeight: "700" as const,
    letterSpacing: 0.37,
  },
  h2: {
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.36,
  },
  h3: {
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: 0.35,
  },

  // Subheading styles - Semibold (600)
  subheading: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: "600" as const,
    letterSpacing: -0.41,
  },
  subheadingSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: -0.24,
  },

  // Body styles - Regular (400)
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: "400" as const,
    letterSpacing: -0.41,
  },
  bodySmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: "400" as const,
    letterSpacing: -0.24,
  },

  // Caption styles - Regular (400)
  caption: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: "400" as const,
    letterSpacing: -0.08,
  },
  captionSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: "400" as const,
    letterSpacing: 0.07,
  },

  // Button style - Semibold (600)
  button: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: "600" as const,
    letterSpacing: -0.41,
  },
  buttonSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: -0.24,
  },
} as const;

export default Typography;
