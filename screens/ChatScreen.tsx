import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RemoteImage } from "@/lib/components/common/RemoteImage";
import type { SupportMessage } from "@/lib/services/supportChat";
import { submitSupportRating, uploadSupportAttachment } from "@/lib/services/supportChat";
import { useSupportChatStore } from "@/lib/stores/supportChatStore";
import { useAuth } from "@/context/AuthContext";

const HEADER_NAVY = "#0b1f3a";
const BOT_BUBBLE = "#f1f1f1";
const USER_BUBBLE = "#0b1f3a";
const USER_TEXT = "#fff";
const BG = "#f6f7f9";

const QUICK_CHIPS = [
  "Track Order",
  "Book Appointment",
  "Talk To Expert",
  "Find Boutique",
  "Latest Offers",
  "Gold Plans",
];

const WELCOME_ACTIONS = [
  { emoji: "📦", label: "Track Order" },
  { emoji: "📅", label: "Book Appointment" },
  { emoji: "📞", label: "Request Callback" },
  { emoji: "💰", label: "Gold Plans" },
  { emoji: "🏬", label: "Find Boutique" },
  { emoji: "👨‍💼", label: "Talk To Expert" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReadReceipt({ status }: { status: SupportMessage["deliveryStatus"] }) {
  const color = status === "read" ? "#22c55e" : status === "delivered" ? "#94a3b8" : "#cbd5e1";
  const marks = status === "sent" ? "✓" : "✓✓";
  return <Text style={[styles.receipt, { color }]}>{marks}</Text>;
}

function TypingDots() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.Text style={[styles.typingText, { opacity }]}>
      GehnaHub Support is typing...
    </Animated.Text>
  );
}

function RatingModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
}) {
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState("");
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.ratingOverlay}>
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Rate your support experience</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setStars(n)} hitSlop={8}>
                <Text style={styles.star}>{n <= stars ? "⭐" : "☆"}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.ratingInput}
            placeholder="Optional feedback"
            placeholderTextColor="#94a3b8"
            value={feedback}
            onChangeText={setFeedback}
            multiline
          />
          <Pressable
            style={[styles.ratingSubmit, stars < 1 && { opacity: 0.5 }]}
            disabled={stars < 1}
            onPress={() => {
              onSubmit(stars, feedback);
              setStars(0);
              setFeedback("");
            }}
          >
            <Text style={styles.ratingSubmitText}>Submit</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.ratingSkip}>
            <Text style={styles.ratingSkipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type ListItem =
  | { kind: "date"; id: string; label: string }
  | { kind: "message"; id: string; message: SupportMessage };

export default function ChatScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const listRef = useRef<FlatList<ListItem>>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    conversation,
    messages,
    loading,
    sending,
    error,
    agentTyping,
    initialize,
    sendText,
    sendAttachment,
    notifyTyping,
    startSync,
    stopSync,
    clear,
  } = useSupportChatStore();

  const [input, setInput] = useState("");
  const [ratingOpen, setRatingOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const quickOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    void initialize(user.id, user.full_name);
    return () => clear();
  }, [isAuthenticated, user?.id, user?.full_name, initialize, clear]);

  useFocusEffect(
    useCallback(() => {
      startSync();
      return () => stopSync();
    }, [startSync, stopSync]),
  );

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const showQuickActions = input.trim().length === 0 && !keyboardVisible;

  useEffect(() => {
    Animated.timing(quickOpacity, {
      toValue: showQuickActions ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showQuickActions, quickOpacity]);

  useEffect(() => {
    if (conversation?.status === "resolved") {
      setRatingOpen(true);
    }
  }, [conversation?.status]);

  const listItems = useMemo(() => {
    const items: ListItem[] = [];
    let lastDate = "";
    for (const msg of messages) {
      const label = formatDateLabel(msg.createdAt);
      if (label !== lastDate) {
        items.push({ kind: "date", id: `d-${msg.id}`, label });
        lastDate = label;
      }
      items.push({ kind: "message", id: msg.id, message: msg });
    }
    return items;
  }, [messages]);

  const showWelcome = useMemo(() => {
    const nonSystem = messages.filter((m) => m.senderType === "customer");
    return nonSystem.length === 0;
  }, [messages]);

  const agentName = conversation?.assignedAgent?.name ?? "GehnaHub Support";
  const agentOnline =
    (conversation?.assignedAgent?.status ?? "online") === "online";

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, agentTyping, scrollToBottom]);

  const handleInputChange = useCallback(
    (text: string) => {
      setInput(text);
      notifyTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => notifyTyping(false), 1200);
    },
    [notifyTyping],
  );

  const handleSend = useCallback(() => {
    const t = input.trim();
    if (!t) return;
    notifyTyping(false);
    setInput("");
    void sendText(t);
  }, [input, notifyTyping, sendText]);

  const onChip = useCallback(
    (label: string) => {
      void sendText(label, { quickReply: true });
    },
    [sendText],
  );

  const pickAttachment = useCallback(async () => {
    if (!user?.id) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      const uploaded = await uploadSupportAttachment(
        user.id,
        asset.uri,
        asset.mimeType ?? "image/jpeg",
      );
      await sendAttachment(uploaded.url, uploaded.messageType as "image" | "pdf");
    } catch {
      /* store sets error */
    }
  }, [user?.id, sendAttachment]);

  const pickPdf = useCallback(async () => {
    if (!user?.id) return;
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const uploaded = await uploadSupportAttachment(
        user.id,
        asset.uri,
        "application/pdf",
      );
      await sendAttachment(uploaded.url, "pdf", asset.name);
    } catch {
      /* store sets error */
    }
  }, [user?.id, sendAttachment]);

  const renderMessage = useCallback((item: SupportMessage) => {
    const isUser = item.senderType === "customer";
    const isSystem = item.senderType === "system";

    if (item.messageType === "callback_card") {
      return (
        <View style={styles.msgWrap}>
          <View style={styles.callbackCard}>
            <Text style={styles.callbackTitle}>Request a callback</Text>
            <Pressable
              style={styles.callbackBtn}
              onPress={() => router.push("/(app)/(tabs)/profile")}
            >
              <Text style={styles.callbackBtnText}>OPEN PROFILE</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (item.attachmentUrl && item.messageType === "image") {
      return (
        <View style={[styles.msgWrap, isUser && styles.msgWrapUser]}>
          <RemoteImage uri={item.attachmentUrl} style={styles.attachImg} />
          {item.message ? (
            <Text style={styles.attachCaption}>{item.message}</Text>
          ) : null}
        </View>
      );
    }

    if (item.attachmentUrl && item.messageType === "pdf") {
      return (
        <View style={[styles.msgWrap, isUser && styles.msgWrapUser]}>
          <Pressable onPress={() => Linking.openURL(item.attachmentUrl!)}>
            <Text style={styles.pdfLink}>📄 {item.message || "Document"}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={[styles.msgWrap, isUser ? styles.msgWrapUser : styles.msgWrapBot]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.message}
          </Text>
        </View>
        <View style={[styles.metaRow, isUser && styles.metaRowUser]}>
          <Text style={styles.meta}>
            {formatTime(item.createdAt)}
            {isSystem ? " • SYSTEM" : isUser ? " • YOU" : " • SUPPORT"}
          </Text>
          {isUser ? <ReadReceipt status={item.deliveryStatus} /> : null}
        </View>
      </View>
    );
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === "date") {
        return (
          <View style={styles.dateSep}>
            <Text style={styles.dateSepText}>{item.label}</Text>
          </View>
        );
      }
      return renderMessage(item.message);
    },
    [renderMessage],
  );

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.emptyWrap}>
          <MaterialIcons name="support-agent" size={48} color={HEADER_NAVY} />
          <Text style={styles.emptyTitle}>Need Help?</Text>
          <Text style={styles.emptySub}>
            Sign in to start a conversation with GehnaHub Support.
          </Text>
          <Pressable
            style={styles.startBtn}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.startBtnText}>Sign in to chat</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios" size={22} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{agentName}</Text>
            <Text style={styles.headerSub}>
              {agentOnline ? "● Online" : "Away"} • {conversation?.ticketNumber ?? "—"}
            </Text>
          </View>
          <Pressable hitSlop={12} onPress={() => router.push("/(app)/support-history")}>
            <MaterialIcons name="history" size={22} color="#fff" />
          </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={HEADER_NAVY} />
          </View>
        ) : !conversation ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Need Help?</Text>
            <Text style={styles.emptySub}>
              Start a conversation with GehnaHub Support.
            </Text>
            <Pressable
              style={styles.startBtn}
              disabled={starting}
              onPress={async () => {
                setStarting(true);
                await initialize(user.id, user.full_name);
                setStarting(false);
              }}
            >
              <Text style={styles.startBtnText}>
                {starting ? "Starting..." : "Start Chat"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.chatColumn}>
            <FlatList
              ref={listRef}
              data={listItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={scrollToBottom}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              ListHeaderComponent={
                showWelcome ? (
                  <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeHi}>
                      Hello {user.full_name.split(" ")[0]} 👋
                    </Text>
                    <Text style={styles.welcomeSub}>How can we help today?</Text>
                    <View style={styles.welcomeGrid}>
                      {WELCOME_ACTIONS.map((a) => (
                        <Pressable
                          key={a.label}
                          style={styles.welcomeAction}
                          onPress={() => onChip(a.label)}
                        >
                          <Text style={styles.welcomeEmoji}>{a.emoji}</Text>
                          <Text style={styles.welcomeActionText}>{a.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null
              }
              ListFooterComponent={
                agentTyping ? (
                  <View style={styles.typingWrap}>
                    <TypingDots />
                  </View>
                ) : null
              }
            />

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <Animated.View
              style={[styles.quickActionsWrap, { opacity: quickOpacity }]}
              pointerEvents={showQuickActions ? "auto" : "none"}
            >
              <View style={styles.chipRow}>
                {QUICK_CHIPS.map((chip) => (
                  <Pressable key={chip} style={styles.chip} onPress={() => onChip(chip)}>
                    <Text style={styles.chipText}>{chip}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            <SafeAreaView edges={["bottom"]} style={styles.footerSafe}>
              <View style={styles.inputSection}>
                <View style={styles.inputBar}>
                  <View style={styles.inputPill}>
                    <TextInput
                      style={styles.input}
                      value={input}
                      onChangeText={handleInputChange}
                      placeholder="Type your message..."
                      placeholderTextColor="#94a3b8"
                      multiline
                      maxLength={2000}
                    />
                    <Pressable hitSlop={8} onPress={pickAttachment}>
                      <MaterialIcons name="image" size={22} color="#64748b" />
                    </Pressable>
                    <Pressable hitSlop={8} onPress={pickPdf}>
                      <MaterialIcons name="attach-file" size={22} color="#64748b" />
                    </Pressable>
                  </View>
                  <Pressable
                    style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                    onPress={handleSend}
                    disabled={sending}
                  >
                    <MaterialIcons name="send" size={20} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </View>
        )}
      </KeyboardAvoidingView>

      <RatingModal
        visible={ratingOpen}
        onClose={() => setRatingOpen(false)}
        onSubmit={async (rating, feedback) => {
          if (!conversation || !user) return;
          await submitSupportRating(user.id, conversation.id, rating, feedback);
          setRatingOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: HEADER_NAVY,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  chatColumn: { flex: 1, minHeight: 0 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12, flexGrow: 1 },
  quickActionsWrap: { paddingHorizontal: 12, paddingBottom: 4 },
  footerSafe: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e8eaef" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  msgWrap: { marginBottom: 12, maxWidth: "88%" },
  msgWrapBot: { alignSelf: "flex-start" },
  msgWrapUser: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleBot: { backgroundColor: BOT_BUBBLE },
  bubbleUser: { backgroundColor: USER_BUBBLE },
  bubbleText: { fontSize: 14, lineHeight: 20, color: "#1e293b" },
  bubbleTextUser: { color: USER_TEXT },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaRowUser: { alignSelf: "flex-end" },
  meta: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase" },
  receipt: { fontSize: 10, color: "#64748b" },
  dateSep: { alignItems: "center", marginVertical: 12 },
  dateSepText: {
    fontSize: 11,
    color: "#94a3b8",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: HEADER_NAVY,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  chipText: { fontSize: 12, fontWeight: "700", color: HEADER_NAVY },
  inputSection: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 24,
    paddingLeft: 14,
    paddingRight: 8,
    minHeight: 46,
  },
  input: { flex: 1, fontSize: 14, color: "#0f172a", maxHeight: 100 },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: HEADER_NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e8eaef",
  },
  welcomeHi: { fontSize: 18, fontWeight: "800", color: HEADER_NAVY },
  welcomeSub: { fontSize: 14, color: "#64748b", marginTop: 4, marginBottom: 12 },
  welcomeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  welcomeAction: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  welcomeEmoji: { fontSize: 18 },
  welcomeActionText: { fontSize: 12, fontWeight: "700", color: HEADER_NAVY, marginTop: 4 },
  typingWrap: { paddingVertical: 8, paddingHorizontal: 4 },
  typingText: { fontSize: 12, color: "#64748b", fontStyle: "italic" },
  attachImg: { width: 220, height: 160, borderRadius: 12 },
  attachCaption: { fontSize: 12, color: "#64748b", marginTop: 4 },
  pdfLink: { fontSize: 14, fontWeight: "700", color: HEADER_NAVY },
  callbackCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e8eaef",
  },
  callbackTitle: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  callbackBtn: {
    backgroundColor: HEADER_NAVY,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  callbackBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: HEADER_NAVY, marginTop: 12 },
  emptySub: { fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 8 },
  startBtn: {
    marginTop: 20,
    backgroundColor: HEADER_NAVY,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  startBtnText: { color: "#fff", fontWeight: "800" },
  errorBanner: {
    textAlign: "center",
    color: "#b91c1c",
    fontSize: 12,
    padding: 8,
  },
  ratingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  ratingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  ratingTitle: { fontSize: 17, fontWeight: "800", color: HEADER_NAVY, marginBottom: 12 },
  starRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 12 },
  star: { fontSize: 28 },
  ratingInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    marginBottom: 12,
    fontSize: 14,
  },
  ratingSubmit: {
    backgroundColor: HEADER_NAVY,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  ratingSubmitText: { color: "#fff", fontWeight: "800" },
  ratingSkip: { alignItems: "center", marginTop: 10 },
  ratingSkipText: { color: "#64748b", fontSize: 13 },
});
