import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export type CheckboxItemProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
};

export function CheckboxItem({ label, checked, onToggle }: CheckboxItemProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="flex-row items-center gap-3 border-b border-slate-100 py-3.5 active:bg-slate-50"
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded border ${
          checked ? 'border-indigo-900 bg-indigo-900' : 'border-slate-300 bg-white'
        }`}
      >
        {checked ? <MaterialIcons name="check" size={14} color="#fff" /> : null}
      </View>
      <Text className="flex-1 text-sm font-semibold text-slate-900">{label}</Text>
    </Pressable>
  );
}
