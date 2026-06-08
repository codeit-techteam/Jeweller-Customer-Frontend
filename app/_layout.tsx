import Feather from "@expo/vector-icons/Feather";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Font from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { AppConfigGate } from "@/components/AppConfigGate";
import { StartupErrorBoundary } from "@/components/StartupErrorBoundary";
import { FullScreenLoader } from "@/components/loaders";
import { logStartupConfig } from "@/lib/appConfig";
import { DiscoveryLocationBootstrap } from "@/components/DiscoveryLocationBootstrap";
import { UserLocationBootstrap } from "@/components/UserLocationBootstrap";
import { AuthProvider } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { GlobalPopup } from "@/lib/components/common/GlobalPopup";
import { InAppNotificationBanner } from "@/lib/components/common/InAppNotificationBanner";
import { GuestBanner } from "@/lib/components/common/GuestBanner";
import { LoginRequiredSheet } from "@/lib/components/common/LoginRequiredSheet";
import { PostLoginSyncHandler } from "@/lib/components/common/PostLoginSyncHandler";
import { toastConfig } from "@/lib/components/common/Toast";
import { WishlistToast } from "@/lib/components/common/WishlistToast";
import { CustomSplashScreen } from "@/src/components/CustomSplashScreen";
import { QueryProvider } from "@/src/providers/QueryProvider";

export const unstable_settings = {
  anchor: "location-permission",
};

/**
 * Floating, safe-area-aware toast host.
 *
 * Uses `react-native-toast-message` for positioning + slide animation, with our
 * custom `toastConfig` for the modern card UI. The top offset is anchored to
 * the device status bar so the card never collides with notches or the clock.
 */
function AppToast() {
  const insets = useSafeAreaInsets();
  return (
    <Toast
      config={toastConfig}
      position="top"
      topOffset={Math.max(insets.top, 12) + 8}
      visibilityTime={2400}
      autoHide
      swipeable
    />
  );
}

export default function RootLayout() {
  useColorScheme();
  const [phase, setPhase] = useState<"checking" | "splash" | "app">("checking");
  const [bootKey, setBootKey] = useState(0);

  useEffect(() => {
    logStartupConfig();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([
          MaterialIcons.loadFont(),
          Feather.loadFont(),
          Font.loadAsync(FontAwesome5.font),
        ]);
      } catch (e) {
        if (__DEV__) {
          console.warn(
            "[RootLayout] Vector icon font preload failed (check device can reach Metro, or use USB reverse / tunnel):",
            e,
          );
        }
      }
    })();
  }, []);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem("hasSeenCustomSplash");
        if (hasSeen === "true") {
          setPhase("app");
          return;
        }
        await AsyncStorage.setItem("hasSeenCustomSplash", "true");
        setPhase("splash");
      } catch {
        setPhase("app");
      }
    };

    void checkFirstLaunch();
  }, []);

  if (phase === "checking") {
    return <FullScreenLoader label="Preparing app..." />;
  }

  if (phase === "splash") {
    return <CustomSplashScreen onFinish={() => setPhase("app")} />;
  }

  return (
    <StartupErrorBoundary onRetry={() => setBootKey((k) => k + 1)}>
      <GestureHandlerRootView style={{ flex: 1 }} key={bootKey}>
        <SafeAreaProvider>
          <AppConfigGate>
            <BottomSheetModalProvider>
              <QueryProvider>
                <AuthProvider>
                  <PostLoginSyncHandler />
                  <UserLocationBootstrap />
                  <DiscoveryLocationBootstrap />
                  <Stack>
                    <Stack.Screen
                      name="(app)"
                      options={{ headerShown: false, animation: "fade" }}
                    />
                    <Stack.Screen
                      name="(auth)"
                      options={{ headerShown: false, animation: "fade" }}
                    />
                    <Stack.Screen
                      name="location-permission"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="location-manual"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="menu"
                      options={{
                        headerShown: false,
                        presentation: "transparentModal",
                        animation: "fade",
                        animationDuration: 200,
                      }}
                    />
                    <Stack.Screen
                      name="modal"
                      options={{ presentation: "modal", title: "Modal" }}
                    />
                  </Stack>
                  <StatusBar style="auto" />
                  <GuestBanner />
                  <LoginRequiredSheet />
                  <AppToast />
                  <WishlistToast />
                  <GlobalPopup />
                  <InAppNotificationBanner />
                </AuthProvider>
              </QueryProvider>
            </BottomSheetModalProvider>
          </AppConfigGate>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </StartupErrorBoundary>
  );
}
