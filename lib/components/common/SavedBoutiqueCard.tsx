import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BoutiqueActionButtons } from '@/lib/components/common/BoutiqueActionButtons';
import { BoutiqueStatusBadge } from '@/lib/components/common/BoutiqueStatusBadge';
import { RemoteImage } from '@/lib/components/common/RemoteImage';
import {
  selectDistanceLineGpsFailed,
  useUserLocationStore,
} from '@/lib/stores/userLocationStore';
import {
  boutiqueHasCoordinates,
  formatBoutiqueDistanceLine,
} from '@/lib/utils/formatBoutiqueDistance';
import type { SavedBoutique } from '@/lib/services/mock/savedBoutiques';
import { PLACEHOLDER_IMAGE_URI } from '@/lib/services/mock/imageUrls';

const TITLE = '#0B1B2B';
const META = '#7A869A';
const OUTLINE = '#1C2B39';
const PIN_COLOR = '#B45309';
const STAR_COLOR = '#C9A227';
const VERIFIED_BG = 'rgba(201, 166, 70, 0.15)';

type Props = {
  item: SavedBoutique;
  onPlanVisit: () => void;
  onDirections: () => void;
  onCall: () => void;
  onMenuPress: () => void;
  onNamePress?: () => void;
};

function threePreviewUris(item: SavedBoutique): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const u of item.previewImages || []) {
    if (u && typeof u === 'string' && u.startsWith('http') && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  const hero = item.image && typeof item.image === 'string' && item.image.startsWith('http') ? item.image : null;
  if (hero && !seen.has(hero)) {
    out.unshift(hero);
    seen.add(hero);
  }
  while (out.length < 3 && hero) {
    out.push(hero);
  }
  return out.length ? out.slice(0, 3) : [PLACEHOLDER_IMAGE_URI];
}

export function SavedBoutiqueCard({
  item,
  onPlanVisit,
  onDirections,
  onCall,
  onMenuPress,
  onNamePress,
}: Props) {
  const images = useMemo(() => threePreviewUris(item), [item]);
  const locationLoading = useUserLocationStore((s) => s.loading);
  const locationPermission = useUserLocationStore((s) => s.permission);
  const userLocationGpsFailed = useUserLocationStore(selectDistanceLineGpsFailed);
  const showHoursBadge = Boolean(item.openingTime && item.closingTime);

  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Pressable
          onPress={onNamePress}
          disabled={!onNamePress}
          style={styles.namePress}
          hitSlop={onNamePress ? undefined : 0}
        >
          <Text style={styles.boutiqueName} numberOfLines={1}>
            {item.name}
          </Text>
        </Pressable>
        <View style={styles.rowEnd}>
          {item.verified ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✔ VERIFIED</Text>
            </View>
          ) : null}
          <Pressable hitSlop={10} onPress={onMenuPress} accessibilityRole="button" accessibilityLabel="More options">
            <MaterialIcons name="more-vert" size={22} color={TITLE} />
          </Pressable>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialIcons name="star" size={15} color={STAR_COLOR} style={styles.metaIcon} />
          <Text style={styles.metaText}>
            {item.rating.toFixed(1)} (
            {item.reviews > 0 ? `${item.reviews} reviews` : 'No reviews yet'})
          </Text>
        </View>
        <Text style={styles.metaDot}> • </Text>
        <View style={styles.metaItem}>
          <MaterialIcons name="place" size={16} color={PIN_COLOR} style={styles.metaIcon} />
          <Text style={styles.metaText}>
            {formatBoutiqueDistanceLine({
              distanceKm: item.distanceKm,
              locationLoading,
              hasBoutiqueCoords: boutiqueHasCoordinates(item),
              permission: locationPermission,
              userLocationGpsFailed,
            })}
          </Text>
        </View>
      </View>

      {showHoursBadge ? (
        <View style={styles.statusRow}>
          <BoutiqueStatusBadge
            isOpen={item.openNow}
            subLabel={item.statusSubLabel}
            opensAt={item.openingTime}
            closesAt={item.closingTime}
            variant="compact"
          />
        </View>
      ) : null}

      <View style={styles.imageRow}>
        {images.map((uri, i) => (
          <View key={`${uri}-${i}`} style={styles.imageWrap}>
            <RemoteImage uri={uri} fallbackTint="#e8e4dc" style={StyleSheet.absoluteFillObject} />
          </View>
        ))}
      </View>

      <BoutiqueActionButtons
        onDirections={onDirections}
        onCall={onCall}
        onBookAppt={onPlanVisit}
        style={styles.actionRow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11, 27, 43, 0.06)',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  namePress: { flex: 1, minWidth: 0 },
  boutiqueName: {
    fontSize: 16,
    fontWeight: '700',
    color: TITLE,
  },
  rowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    backgroundColor: VERIFIED_BG,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: OUTLINE,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 13,
    color: META,
  },
  metaDot: {
    fontSize: 13,
    color: META,
  },
  statusRow: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  imageRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  imageWrap: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F6F8',
  },
  actionRow: {
    paddingHorizontal: 12,
    gap: 12,
  },
});
