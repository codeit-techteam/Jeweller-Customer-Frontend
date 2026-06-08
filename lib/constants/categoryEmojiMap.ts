const categoryEmojiMap: Record<string, string> = {
  rings: "💍",
  bangles: "📿",
  bracelets: "⌚",
  earrings: "✨",
  necklaces: "📿",
  pendants: "🪬",
  chains: "🔗",
  coins: "🪙",
  mangalsutra: "❤️",
  anklets: "🦶",
  "nose-pins": "💎",
  brooches: "🌸",
  sets: "👑",
  default: "💎",
};

export function getCategoryEmoji(slug: string): string {
  const key = slug.trim().toLowerCase().replace(/\s+/g, "-");
  return categoryEmojiMap[key] ?? categoryEmojiMap.default;
}
