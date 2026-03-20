import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ELECTRIC_BLUE = "#007AFF";

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Muscle AI] Error caught by boundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Brand */}
            <View style={styles.iconCircle}>
              <IconSymbol name="xmark.circle.fill" size={48} color="#FF3D3D" />
            </View>

            <Text style={styles.title}>Something Went Wrong</Text>
            <Text style={styles.subtitle}>
              Muscle AI encountered an unexpected error. Your data is safe — try again or restart the app.
            </Text>

            {/* Error details (collapsed) */}
            {this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorLabel}>Error Details</Text>
                <ScrollView style={styles.errorScroll} nestedScrollEnabled>
                  <Text style={styles.errorMessage}>{this.state.error.message}</Text>
                </ScrollView>
              </View>
            )}

            {/* Retry Button */}
            <TouchableOpacity
              onPress={this.handleRetry}
              activeOpacity={0.8}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>

            {/* Support link */}
            <Text style={styles.supportText}>
              If this keeps happening, visit Settings → Help & Support
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E14",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  content: {
    alignItems: "center",
    maxWidth: 340,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,61,61,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#9BA1A6",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  errorDetails: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5A6A7A",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  errorScroll: {
    maxHeight: 80,
  },
  errorMessage: {
    fontSize: 13,
    color: "#FF6B6B",
    fontFamily: "monospace",
  },
  retryButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    backgroundColor: ELECTRIC_BLUE,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  supportText: {
    fontSize: 13,
    color: "#5A6A7A",
    textAlign: "center",
  },
});
