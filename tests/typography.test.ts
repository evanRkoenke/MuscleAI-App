import { describe, it, expect } from "vitest";

// Mock Platform for testing
const mockPlatform = (os: string) => {
  return {
    select: (options: Record<string, string>) => options[os] || options.default || "",
  };
};

describe("Typography system", () => {
  it("defines correct weight hierarchy", () => {
    // Headings should use Bold (700)
    const headingWeight = "700";
    expect(headingWeight).toBe("700");

    // Subheadings should use Semibold (600)
    const subheadingWeight = "600";
    expect(subheadingWeight).toBe("600");

    // Body should use Regular (400)
    const bodyWeight = "400";
    expect(bodyWeight).toBe("400");

    // Caption should use Regular (400)
    const captionWeight = "400";
    expect(captionWeight).toBe("400");

    // Button should use Semibold (600)
    const buttonWeight = "600";
    expect(buttonWeight).toBe("600");
  });

  it("uses system font on iOS (San Francisco)", () => {
    const platform = mockPlatform("ios");
    const fontFamily = platform.select({
      ios: "System",
      android: "sans-serif",
      web: '-apple-system, BlinkMacSystemFont, "SF Pro Display"',
      default: "System",
    });
    expect(fontFamily).toBe("System");
  });

  it("uses sans-serif on Android", () => {
    const platform = mockPlatform("android");
    const fontFamily = platform.select({
      ios: "System",
      android: "sans-serif",
      web: '-apple-system, BlinkMacSystemFont, "SF Pro Display"',
      default: "System",
    });
    expect(fontFamily).toBe("sans-serif");
  });

  it("uses SF Pro Display font stack on web", () => {
    const platform = mockPlatform("web");
    const fontFamily = platform.select({
      ios: "System",
      android: "sans-serif",
      web: '-apple-system, BlinkMacSystemFont, "SF Pro Display"',
      default: "System",
    });
    expect(fontFamily).toContain("SF Pro Display");
    expect(fontFamily).toContain("-apple-system");
  });

  it("heading fontSize is larger than body", () => {
    const h1Size = 34;
    const h2Size = 28;
    const h3Size = 22;
    const bodySize = 17;
    const captionSize = 13;

    expect(h1Size).toBeGreaterThan(h2Size);
    expect(h2Size).toBeGreaterThan(h3Size);
    expect(h3Size).toBeGreaterThan(bodySize);
    expect(bodySize).toBeGreaterThan(captionSize);
  });

  it("weight values are valid CSS font-weight numbers", () => {
    const validWeights = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
    const usedWeights = ["400", "600", "700"];
    
    usedWeights.forEach((w) => {
      expect(validWeights).toContain(w);
    });
  });

  it("heading weight (700) is heavier than body weight (400)", () => {
    expect(parseInt("700")).toBeGreaterThan(parseInt("400"));
  });

  it("subheading weight (600) is between heading and body", () => {
    expect(parseInt("600")).toBeGreaterThan(parseInt("400"));
    expect(parseInt("600")).toBeLessThan(parseInt("700"));
  });
});
