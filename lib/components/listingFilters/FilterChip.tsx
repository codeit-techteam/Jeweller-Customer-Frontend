import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export type FilterChipProps = {
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: keyof typeof Feather.glyphMap;
};

export function FilterChip({ label, icon, onPress, active }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        chipStyles.chip,
        active ? chipStyles.chipActive : chipStyles.chipInactive,
      ]}
    >
      {icon && (
        <Feather
          name={icon}
          size={14}
          color={active ? '#FFFFFF' : '#333333'}
        />
      )}
      <Text
        style={[
          chipStyles.label,
          active ? chipStyles.labelActive : chipStyles.labelInactive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#0B1C2C',
    borderColor: '#0B1C2C',
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  label: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelInactive: {
    color: '#333333',
  },
});
