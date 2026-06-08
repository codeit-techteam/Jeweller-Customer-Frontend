import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

type Props = {
  text: string;
  highlight: string;
  style?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function HighlightedText({
  text,
  highlight,
  style,
  highlightStyle,
  numberOfLines = 1,
}: Props) {
  const needle = highlight.trim();
  if (!needle) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text key={i} style={[style, highlightStyle]}>
            {part}
          </Text>
        ) : (
          <Text key={i} style={style}>
            {part}
          </Text>
        ),
      )}
    </Text>
  );
}
