import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export type FilterSidebarKey = 'type' | 'price' | 'metal' | 'rating' | 'discount';

const ROWS: { key: FilterSidebarKey; label: string }[] = [
  { key: 'type', label: 'Type' },
  { key: 'price', label: 'Price' },
  { key: 'metal', label: 'Metal' },
  { key: 'rating', label: 'Rating' },
  { key: 'discount', label: 'Discount' },
];

export type FilterSidebarProps = {
  active: FilterSidebarKey;
  onChange: (key: FilterSidebarKey) => void;
};

export function FilterSidebar({ active, onChange }: FilterSidebarProps) {
  return (
    <View className="w-[34%] border-r border-slate-200 bg-slate-100">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="py-2">
        {ROWS.map((row) => {
          const on = row.key === active;
          return (
            <Pressable
              key={row.key}
              onPress={() => onChange(row.key)}
              className={`border-l-4 px-3 py-3.5 ${on ? 'border-indigo-900 bg-white' : 'border-transparent'}`}
            >
              <Text
                className={`text-xs font-bold ${on ? 'text-indigo-950' : 'text-slate-500'}`}
                numberOfLines={2}
              >
                {row.label}
              </Text>
            </Pressable>
          );
        })}
        </View>
      </ScrollView>
    </View>
  );
}
