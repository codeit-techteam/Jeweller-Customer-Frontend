/**
 * Featured boutique card (Home → Featured Boutiques Near You).
 * Action row uses shared BoutiqueActionButtons.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { BoutiqueUiListItem } from '@/lib/boutiques/boutiqueUi';
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

const TITLE = '#0B1B2B';
const META = '#6B7280';
const STAR_GOLD = '#C9A227';
const CORAL = '#E76F51';
const TAG_BG = '#E8EEF5';
const TAG_TEXT = '#4B5563';
const VERIFIED_PILL_BG = '#F3F4F6';
const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
  default: {},
});

type Props = {
  item: BoutiqueUiListItem;
  onPressCard: () => void;
  onDirections: () => void;
  onCall: () => void;
  onBookAppt: () => void;
};

function showVerifiedOverlay(item: BoutiqueUiListItem): boolean {
  return /VERIFIED|TRUSTED|PREMIER|CURATED|PARTNER/i.test(item.tag);
}

export function FeaturedBoutiqueCard({
  item,
  onPressCard,
  onDirections,
  onCall,
  onBookAppt,
}: Props) {
  const locationLoading = useUserLocationStore((s) => s.loading);
  const locationPermission = useUserLocationStore((s) => s.permission);
  const userLocationGpsFailed = useUserLocationStore(selectDistanceLineGpsFailed);
  // TODO: restore visits line when copy is final
  // const visits = item.weeklyVisits ?? 24 + (item.id.length % 28);
  // const highlightTail =
  //   item.highlightSuffix ?? 'this week for bespoke bridal consultations.';
  const tagPair = useMemo(() => item.tags.slice(0, 2), [item.tags]);

  return (
    <View style={[styles.card, CARD_SHADOW]}>
      <Pressable
        onPress={onPressCard}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.location}`}
        style={({ pressed }) => [styles.cardPressable, pressed && styles.pressedMain]}
      >
        <View style={styles.imageWrapper}>
          <RemoteImage
            uri={item.image}
            fallbackTint="#d4c8ac"
            placeholder="boutique-cover"
            style={styles.image}
          />
          {showVerifiedOverlay(item) ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✔ VERIFIED BOUTIQUE</Text>
            </View>
          ) : null}
          <View style={styles.statusBadgeWrap} pointerEvents="none">
            <BoutiqueStatusBadge
              isOpen={item.openNow}
              subLabel={item.statusSubLabel}
              opensAt={item.openingTime}
              closesAt={item.closingTime}
              variant="featured"
            />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={15} color={STAR_GOLD} style={styles.starIcon} />
            <Text style={styles.metaText}>{item.rating.toFixed(1)}</Text>
            {item.reviewsCount > 0 ? (
              <>
                <Text style={styles.metaDot}> • </Text>
                <Text style={styles.metaText}>{item.reviewsCount} reviews</Text>
              </>
            ) : null}
            {(() => {
              const distanceLine = formatBoutiqueDistanceLine({
                distanceKm: item.distanceKm,
                locationLoading,
                hasBoutiqueCoords: boutiqueHasCoordinates(item),
                permission: locationPermission,
                userLocationGpsFailed,
              });
              if (!distanceLine) return null;
              return (
                <>
                  <Text style={styles.metaDot}> • </Text>
                  <Text style={styles.metaText}>{distanceLine}</Text>
                </>
              );
            })()}
          </View>

          <View style={styles.locationRow}>
            <MaterialIcons name="place" size={16} color={META} />
            <Text style={styles.location} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          {tagPair.length > 0 ? (
            <View style={styles.tagRow}>
              {tagPair.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* TODO: restore — e.g. "34 visited … this week for bespoke bridal consultations."
          <Text style={styles.highlightText}>
            <Text style={styles.highlightCoral}>{visits} visited</Text>
            {` ${highlightTail}`}
          </Text>
          */}
        </View>
      </Pressable>

      <BoutiqueActionButtons
        onDirections={onDirections}
        onCall={onCall}
        onBookAppt={onBookAppt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
    overflow: 'visible',
  },
  cardPressable: {},
  pressedMain: { opacity: 0.97 },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F0EDE6',
  },
  image: {
    width: '100%',
    height: 190,
    borderRadius: 20,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: VERIFIED_PILL_BG,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    maxWidth: '88%',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: TITLE,
    letterSpacing: 0.4,
  },
  statusBadgeWrap: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    maxWidth: '72%',
    alignItems: 'flex-end',
  },
  content: {
    paddingTop: 2,
  },
  name: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: TITLE,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  starIcon: { marginRight: 4 },
  metaText: {
    fontSize: 14,
    color: META,
  },
  metaDot: {
    fontSize: 14,
    color: META,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  location: {
    flex: 1,
    fontSize: 14,
    color: META,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    backgroundColor: TAG_BG,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: TAG_TEXT,
    letterSpacing: 0.5,
  },
  highlightText: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
    color: META,
  },
  highlightCoral: {
    color: CORAL,
    fontWeight: '700',
  },
});
