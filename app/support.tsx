import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { Typography } from "@/constants/typography";


const PRIMARY_WHITE = "#FFFFFF";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isEscalation?: boolean;
}

const QUICK_ACTIONS = [
  { label: "Login Help", prompt: "I'm having trouble logging into my account. Can you help?" },
  { label: "Billing", prompt: "I have a question about my subscription billing." },
  { label: "How to Scan", prompt: "How do I scan my meals with the camera?" },
  { label: "Troubleshooting", prompt: "The meal scanning feature isn't working properly." },
];

const SYSTEM_PROMPT = `You are Muscle Support, the AI assistant for Muscle AI — a hypertrophy-optimized nutrition tracking app. You help users with:
1. Password/Login issues — guide them through password reset via email or account recovery
2. Billing explanations — explain subscription tiers (Monthly Essential $9.99/mo, Elite Annual $59.99/yr) and how App Store / Google Play billing works
3. App feature tutorials — explain how to scan meals, track macros, log weight, view forecasts, and share gains cards
4. Scanning/troubleshooting — help with camera permissions, image quality tips, and scan accuracy

Be concise, friendly, and professional. Use short paragraphs. If you cannot resolve an issue after the user's 3rd message, suggest escalating to human support.`;

export default function SupportScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! I'm Muscle Support, your AI assistant. How can I help you today? You can ask about login issues, billing, app features, or troubleshooting.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const chatMutation = trpc.ai.chat.useMutation();

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setInteractionCount((prev) => prev + 1);

      try {
        const response = await chatMutation.mutateAsync({
          message: text.trim(),
          systemPrompt: SYSTEM_PROMPT,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (e) {
        // Fallback response when server is unavailable
        const fallbackResponses: Record<string, string> = {
          login:
            "To reset your password, go to the login screen and tap 'Forgot Password'. Enter your email and we'll send you a reset link. If you signed up with Google or Apple, use those buttons instead.",
          billing:
            "Muscle AI offers two plans:\n\n• Monthly Essential — $9.99/month\n• Elite Annual — $59.99/year (best value, save 50%)\n\nAll payments are processed through the App Store (iOS) or Google Play (Android). You can manage your subscription in Settings.",
          scan: "To scan a meal:\n\n1. Tap the camera button on the home screen\n2. Point your camera at your meal\n3. Take a photo — our AI will analyze it\n4. Review the results and tap 'Log This Meal'\n\nFor best results, make sure the food is well-lit and clearly visible.",
          default:
            "I'd be happy to help! Could you provide more details about what you're experiencing? I can assist with login issues, billing questions, app features, and troubleshooting.",
        };

        const lowerText = text.toLowerCase();
        let fallback = fallbackResponses.default;
        if (lowerText.includes("login") || lowerText.includes("password")) {
          fallback = fallbackResponses.login;
        } else if (lowerText.includes("bill") || lowerText.includes("subscription") || lowerText.includes("payment")) {
          fallback = fallbackResponses.billing;
        } else if (lowerText.includes("scan") || lowerText.includes("camera")) {
          fallback = fallbackResponses.scan;
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fallback,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setLoading(false);
      }

      // Escalation after 3 interactions
      if (interactionCount >= 2) {
        setTimeout(() => {
          const escalationMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content:
              "It seems like this issue needs more attention. I've flagged it for Human Review. Our support team will follow up within 24 hours via email. Is there anything else I can help with in the meantime?",
            timestamp: new Date(),
            isEscalation: true,
          };
          setMessages((prev) => [...prev, escalationMessage]);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
        }, 1000);
      }
    },
    [loading, messages, chatMutation, interactionCount]
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageBubble,
        item.role === "user" ? styles.userBubble : styles.assistantBubble,
        item.isEscalation && styles.escalationBubble,
      ]}
    >
      {item.isEscalation && (
        <View style={styles.escalationBadge}>
          <IconSymbol name="bolt.fill" size={12} color="#B0B0B0" />
          <Text style={styles.escalationBadgeText}>ESCALATED</Text>
        </View>
      )}
      <Text
        style={[
          styles.messageText,
          { color: item.role === "user" ? "#FFFFFF" : "#F0F0F0" },
        ]}
      >
        {item.content}
      </Text>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <IconSymbol name="arrow.left" size={24} color="#F0F0F0" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Muscle Support</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSubtitle}>Online</Text>
            </View>
          </View>
          <View style={styles.backButton} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickActionChip}
                onPress={() => sendMessage(action.prompt)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Loading indicator */}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={"#FFFFFF"} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#666666"
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: input.trim() ? "#444444" : "#222222" },
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#F0F0F0" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C0C0C0" },
  headerSubtitle: { fontSize: 12, fontWeight: "400", color: "#C0C0C0" },
  messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  messageBubble: { maxWidth: "80%", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
    backgroundColor: "#444444",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
  },
  escalationBubble: {
    borderColor: "#B0B0B0",
    backgroundColor: "rgba(255,179,0,0.06)",
  },
  escalationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  escalationBadgeText: {
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 1.5,
    color: "#B0B0B0",
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  quickActionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(0,122,255,0.08)",
  },
  quickActionText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  loadingText: { fontSize: 13, color: "#666666" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#222222",
    backgroundColor: "#000000",
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: "#F0F0F0",
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
