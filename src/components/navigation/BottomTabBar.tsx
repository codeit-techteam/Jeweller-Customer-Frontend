import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NAVY = '#0D1B2A';
const MUTED = '#A0A0A0';

const tabs = [
  { label: 'HOME', route: '/(app)/home', icon: 'home' as const, iconActive: 'home' as const },
  { label: 'COLLECTIONS', route: '/(app)/categories', icon: 'diamond' as const, iconActive: 'diamond' as const },
  { label: 'BOUTIQUES', route: '/(app)/boutiques', icon: 'store' as const, iconActive: 'store' as const },
  {
    label: 'PROFILE',
    route: '/(app)/(tabs)/profile',
    icon: 'person-outline' as const,
    iconActive: 'person' as const,
  },
] as const;

function isTabActive(pathname: string, route: string): boolean {
  if (pathname === route) return true;
  if (route === '/(app)/home') {
    return pathname.endsWith('/home') && !pathname.includes('(tabs)');
  }
  if (route === '/(app)/categories') {
    return pathname.includes('/categories') || pathname.includes('category-products');
  }
  if (route === '/(app)/boutiques') {
    return pathname.includes('/boutiques') && !pathname.includes('boutique-profile');
  }
  if (route === '/(app)/(tabs)/profile') {
    return (
      pathname.includes('(tabs)/profile') ||
      (pathname.endsWith('/profile') && !pathname.includes('boutique-profile'))
    );
  }
  return false;
}

const ICON_SIZE = 22;
const ICON_WRAPPER = 24;

/** Full-width row tabs; SafeAreaView handles home indicator on APK / notched devices. */
export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.bar}>
        <View style={styles.row}>
          {tabs.map((tab) => {
            const active = isTabActive(pathname, tab.route);
            const iconName = active ? tab.iconActive : tab.icon;
            return (
              <Pressable
                key={tab.route}
                style={({ pressed }) => [styles.tab, pressed && { opacity: 0.85 }]}
                onPress={() => router.replace(tab.route)}
              >
                <View style={styles.tabColumn}>
                  <View style={styles.iconWrapper}>
                    <MaterialIcons
                      name={iconName}
                      size={ICON_SIZE}
                      color={active ? NAVY : MUTED}
                      style={styles.iconGlyph}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.label, active ? styles.active : styles.inactive]}
                  >
                    {tab.label}
                  </Text>
                  <View style={styles.indicatorRow}>
                    {active ? <View style={styles.activeIndicator} /> : <View style={styles.indicatorSpacer} />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
    backgroundColor: '#fff',
  },
  bar: {
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  tab: {
    flex: 1,
    maxWidth: '25%',
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  /** Full width of tab slot so icon, text, and indicator share one vertical center line. */
  tabColumn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: ICON_WRAPPER,
    height: ICON_WRAPPER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  /** Font icons often sit off-center in the bbox; lock box + lineHeight + textAlign. */
  iconGlyph: {
    width: ICON_WRAPPER,
    height: ICON_WRAPPER,
    textAlign: 'center',
    lineHeight: ICON_WRAPPER,
    ...Platform.select({
      android: { textAlignVertical: 'center' as const },
      default: {},
    }),
  },
  label: {
    width: '100%',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: 'center' as const },
      default: {},
    }),
  },
  indicatorRow: {
    width: '100%',
    marginTop: 4,
    minHeight: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: NAVY,
  },
  indicatorSpacer: {
    width: 22,
    height: 2,
    opacity: 0,
  },
  active: { color: NAVY },
  inactive: { color: MUTED },
});
