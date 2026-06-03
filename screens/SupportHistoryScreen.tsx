import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import {
  fetchConversationHistory,
  type SupportConversation,
} from "@/lib/services/supportChat";

const HEADER_NAVY = "#0b1f3a";

function statusColor(status: string) {
  if (status === "resolved" || status === "closed") return "#059669";
  if (status === "waiting_for_customer") return "#7c3aed";
  return "#d97706";
}

export default function SupportHistoryScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [rows, setRows] = useState<SupportConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await fetchConversationHistory(user.id);
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) void load();
  }, [isAuthenticated, user?.id, load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Previous Tickets</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={HEADER_NAVY} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No previous support tickets yet.</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push("/(app)/chat")}>
              <View style={styles.cardTop}>
                <Text style={styles.ticket}>{item.ticketNumber}</Text>
                <Text style={[styles.status, { color: statusColor(item.status) }]}>
                  {item.status.replace(/_/g, " ").toUpperCase()}
                </Text>
              </View>
              <Text style={styles.preview} numberOfLines={2}>
                {item.lastMessage ?? "No messages"}
              </Text>
              <Text style={styles.date}>
                {new Date(item.updatedAt).toLocaleString("en-IN")}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f7f9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: HEADER_NAVY,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e8eaef",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  ticket: { fontSize: 15, fontWeight: "800", color: HEADER_NAVY },
  status: { fontSize: 10, fontWeight: "800" },
  preview: { fontSize: 13, color: "#475569" },
  date: { fontSize: 11, color: "#94a3b8", marginTop: 8 },
  empty: { textAlign: "center", color: "#64748b", marginTop: 40 },
});
