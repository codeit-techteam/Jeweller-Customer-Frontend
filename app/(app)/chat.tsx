import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RemoteImage } from "@/lib/components/common/RemoteImage";
import { NECKLACE_CATEGORY_ANCHOR } from "@/lib/services/mock/imageUrls";

const HEADER_NAVY = "#0b1f3a";
const BOT_BUBBLE = "#f1f1f1";
const USER_BUBBLE = "#0b1f3a";
const USER_TEXT = "#fff";
const BG = "#f6f7f9";

/** Chat row — discriminated by `type` */
export type Message =
  | {
      id: number;
      sender: "user" | "bot";
      type: "text";
      text: string;
      footer?: string;
    }
  | { id: number; sender: "bot"; type: "callback" }
  | { id: number; sender: "bot"; type: "faq" }
  | {
      id: number;
      sender: "bot";
      type: "order_card";
      orderId: string;
      delivery: string;
      status: string;
      imageUri: string;
    };

function nowFooter(support: boolean) {
  const t = new Date().toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
  return support ? `${t} • ATELIER INDIA SUPPORT` : `${t} • YOU`;
}

function nextId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    sender: "bot",
    type: "text",
    text: "Hello — welcome to Luxe Co Support. I'm here to help with orders, boutique visits, and product questions.",
    footer: "10:02 AM • ATELIER INDIA SUPPORT",
  },
  {
    id: 2,
    sender: "bot",
    type: "faq",
  },
  {
    id: 3,
    sender: "user",
    type: "text",
    text: "I'd like to check on my recent order, please.",
    footer: "10:05 AM • YOU",
  },
  {
    id: 4,
    sender: "bot",
    type: "order_card",
    orderId: "Order #ATC-IND-8821",
    delivery: "Expected Delivery: Oct 24, 2023",
    status: "IN TRANSIT",
    imageUri: NECKLACE_CATEGORY_ANCHOR,
  },
];

export default function ChatScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<Message>>(null);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  /** Callback cards that already received confirmation */
  const [callbackDone, setCallbackDone] = useState<Set<number>>(
    () => new Set(),
  );

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleCallback = useCallback(
    (callbackMessageId: number) => {
      if (callbackDone.has(callbackMessageId)) return;
      setCallbackDone((prev) => new Set(prev).add(callbackMessageId));
      const confirm: Message = {
        id: nextId(),
        sender: "bot",
        type: "text",
        text: "Your callback request has been submitted. Our expert will contact you shortly.",
        footer: nowFooter(true),
      };
      setMessages((prev) => [...prev, confirm]);
    },
    [callbackDone],
  );

  const sendFAQ = useCallback((topic: string) => {
    const uid = nextId();
    const bid = uid + 1;
    const userMsg: Message = {
      id: uid,
      sender: "user",
      type: "text",
      text: topic,
      footer: nowFooter(false),
    };
    const botMsg: Message = {
      id: bid,
      sender: "bot",
      type: "text",
      text: `Sure! Here's the information regarding ${topic}.`,
      footer: nowFooter(true),
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  }, []);

  const pushBotCallbackCard = useCallback(() => {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), sender: "bot", type: "callback" },
    ]);
  }, []);

  const handleSend = useCallback(() => {
    const t = input.trim();
    if (!t) return;

    const uid = nextId();
    const userMsg: Message = {
      id: uid,
      sender: "user",
      type: "text",
      text: t,
      footer: nowFooter(false),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (/talk\s+to\s+expert/i.test(t)) {
      setTimeout(() => pushBotCallbackCard(), 350);
      return;
    }

    setTimeout(() => {
      const botMsg: Message = {
        id: nextId(),
        sender: "bot",
        type: "text",
        text: "Thanks! Our concierge team will assist you shortly.",
        footer: nowFooter(true),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  }, [input, pushBotCallbackCard]);

  const onQuickAction = useCallback(
    (label: string) => {
      const uid = nextId();
      const userMsg: Message = {
        id: uid,
        sender: "user",
        type: "text",
        text: label,
        footer: nowFooter(false),
      };
      setMessages((prev) => [...prev, userMsg]);

      if (/talk\s+to\s+expert/i.test(label)) {
        setTimeout(() => pushBotCallbackCard(), 350);
        return;
      }

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            sender: "bot",
            type: "text",
            text: `We’ve noted “${label}”. A specialist will follow up with next steps.`,
            footer: nowFooter(true),
          },
        ]);
      }, 600);
    },
    [pushBotCallbackCard],
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      if (item.type === "order_card") {
        return (
          <View style={styles.msgWrap}>
            <View style={styles.orderCard}>
              <RemoteImage
                uri={item.imageUri}
                style={styles.orderImg}
                resizeMode="cover"
              />
              <View style={styles.orderBody}>
                <View style={styles.orderTextCol}>
                  <Text style={styles.orderId}>{item.orderId}</Text>
                  <Text style={styles.orderDelivery}>{item.delivery}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.meta}>Just now • ATELIER INDIA SUPPORT</Text>
          </View>
        );
      }

      if (item.type === "callback") {
        const done = callbackDone.has(item.id);
        return (
          <View style={styles.msgWrap}>
            <View style={styles.callbackCard}>
              <Text style={styles.callbackTitle}>
                Would you like us to call you back?
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.callbackBtn,
                  (done || pressed) && { opacity: done ? 0.65 : 0.9 },
                ]}
                onPress={() => handleCallback(item.id)}
                disabled={done}
              >
                <Text style={styles.callbackBtnText}>REQUEST CALLBACK</Text>
              </Pressable>
              <Text style={styles.callbackHint}>
                • Expert available in 2 mins
              </Text>
            </View>
            <Text style={styles.meta}>Now • ATELIER INDIA SUPPORT</Text>
          </View>
        );
      }

      if (item.type === "faq") {
        return (
          <View style={styles.msgWrap}>
            <Text style={styles.faqLabel}>Quick topics</Text>
            <View style={styles.faqContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.faqBtn,
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => sendFAQ("Track Order")}
              >
                <Text style={styles.faqBtnText}>Track Order</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.faqBtn,
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => sendFAQ("Book Appointment")}
              >
                <Text style={styles.faqBtnText}>Book Appointment</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.faqBtn,
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => sendFAQ("Gold Plans")}
              >
                <Text style={styles.faqBtnText}>Gold Plans</Text>
              </Pressable>
            </View>
            <Text style={[styles.faqLabel, { marginTop: 12 }]}>Shortcuts</Text>
            <View style={styles.quickRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.quickPill,
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => onQuickAction("Track my Order")}
              >
                <Text style={styles.quickPillText}>Track my Order</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.quickPill,
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => onQuickAction("Book Boutique Visit")}
              >
                <Text style={styles.quickPillText}>Book Boutique Visit</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.quickPill,
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => onQuickAction("Talk to Expert")}
              >
                <Text style={styles.quickPillText}>Talk to Expert</Text>
              </Pressable>
            </View>
          </View>
        );
      }

      if (item.type === "text") {
        const isUser = item.sender === "user";
        return (
          <View
            style={[
              styles.msgWrap,
              isUser ? styles.msgWrapUser : styles.msgWrapBot,
            ]}
          >
            <View
              style={[
                styles.bubble,
                isUser ? styles.bubbleUser : styles.bubbleBot,
              ]}
            >
              <Text
                style={[styles.bubbleText, isUser && styles.bubbleTextUser]}
              >
                {item.text}
              </Text>
            </View>
            {item.footer ? (
              <Text style={[styles.meta, isUser && styles.metaUser]}>
                {item.footer}
              </Text>
            ) : null}
          </View>
        );
      }

      return null;
    },
    [callbackDone, handleCallback, sendFAQ, onQuickAction],
  );

  const keyExtractor = useCallback((item: Message) => String(item.id), []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.mainColumn}>
          <View style={styles.header}>
            <Pressable
              hitSlop={12}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <MaterialIcons name="arrow-back-ios" size={22} color="#fff" />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Luxe Co Support</Text>
              <Text style={styles.headerSub}>CONCIERGE SERVICE</Text>
            </View>
            <Pressable
              hitSlop={12}
              onPress={() => {}}
              accessibilityRole="button"
            >
              <MaterialIcons name="open-in-full" size={22} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.listWrap}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
              keyboardShouldPersistTaps="handled"
            />
          </View>

          <View style={styles.inputSection}>
            <View style={styles.inputBar}>
              <View style={styles.inputPill}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type your message..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  maxLength={2000}
                />
                <Pressable
                  hitSlop={8}
                  onPress={() => {}}
                  accessibilityLabel="Attach"
                >
                  <MaterialIcons name="attach-file" size={22} color="#64748b" />
                </Pressable>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={handleSend}
                accessibilityRole="button"
                accessibilityLabel="Send message"
              >
                <MaterialIcons name="send" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  mainColumn: {
    flex: 1,
    justifyContent: "space-between",
    position: "relative",
  },
  listWrap: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: HEADER_NAVY,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1.2,
    marginTop: 2,
  },
  list: { flex: 1, backgroundColor: BG },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 100,
  },
  msgWrap: { marginBottom: 14, maxWidth: "100%" },
  msgWrapBot: { alignSelf: "stretch" },
  msgWrapUser: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubble: {
    maxWidth: "88%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleBot: {
    alignSelf: "flex-start",
    backgroundColor: BOT_BUBBLE,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: USER_BUBBLE,
  },
  bubbleText: { fontSize: 14, lineHeight: 20, color: "#1e293b" },
  bubbleTextUser: { color: USER_TEXT },
  meta: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  metaUser: { alignSelf: "flex-end", textAlign: "right" },
  callbackCard: {
    alignSelf: "flex-start",
    maxWidth: "92%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e8eaef",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  callbackTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  callbackBtn: {
    backgroundColor: HEADER_NAVY,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  callbackBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  callbackHint: { fontSize: 12, color: "#64748b" },
  faqLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  faqContainer: { gap: 8, marginBottom: 4 },
  faqBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: HEADER_NAVY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  faqBtnText: { fontSize: 13, fontWeight: "700", color: HEADER_NAVY },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  quickPill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: HEADER_NAVY,
    backgroundColor: "#fff",
  },
  quickPillText: { fontSize: 12, fontWeight: "700", color: HEADER_NAVY },
  orderCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e8eaef",
    maxWidth: "100%",
  },
  orderImg: { width: "100%", height: 140 },
  orderBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    gap: 8,
  },
  orderTextCol: { flex: 1, minWidth: 0 },
  orderId: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  orderDelivery: { fontSize: 12, color: "#64748b", marginTop: 4 },
  statusBadge: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
  },
  inputSection: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 8,
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: HEADER_NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
});
