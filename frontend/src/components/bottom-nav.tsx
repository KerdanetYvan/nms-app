import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@/src/theme/colors";

const PILL_HEIGHT = 70;
const INDICATOR_SIZE = 52;
const TAB_COUNT = 4;

export type NavTab = "home" | "program" | "user" | "settings";
const TAB_ORDER: NavTab[] = ["home", "program", "user", "settings"];

const PATHNAME_TO_TAB: Record<string, NavTab> = {
  "/": "home",
  "/program": "program",
  "/profile": "user",
  "/personal-info": "user",
  "/settings": "settings",
  "/notifications-settings": "settings",
  "/terms": "settings",
  "/privacy": "settings",
};

const TAB_ROUTES: Partial<Record<NavTab, string>> = {
  home: "/",
  program: "/program",
  user: "/profile",
  settings: "/settings",
};

function indicatorX(index: number, tabWidth: number): number {
  return index * tabWidth + (tabWidth - INDICATOR_SIZE) / 2;
}

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <Path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Svg>
  );
}

function ProgramIcon({ color }: { color: string }) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <Path d="M7 16h8" />
      <Path d="M7 11h12" />
      <Path d="M7 6h3" />
    </Svg>
  );
}

function UserIcon({ color }: { color: string }) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

function SettingsIcon({ color }: { color: string }) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <Circle cx={12} cy={12} r={3} />
    </Svg>
  );
}

function TabIcon({ tab, active }: { tab: NavTab; active: boolean }) {
  const color = active ? colors.primary : colors.white;
  if (tab === "home") return <HomeIcon color={color} />;
  if (tab === "program") return <ProgramIcon color={color} />;
  if (tab === "user") return <UserIcon color={color} />;
  return <SettingsIcon color={color} />;
}

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const active: NavTab = PATHNAME_TO_TAB[pathname] ?? "home";

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== "android") return;
    // setBackgroundColorAsync n'est pas compatible avec edgeToEdge, mais
    // setButtonStyleAsync fonctionne et est nécessaire pour garder les icônes
    // de la barre de navigation en blanc sur le fond mauve du navBarFill.
    NavigationBar.setButtonStyleAsync("light").catch(() => {});
  }, []);

  const [pillWidth, setPillWidth] = useState(Dimensions.get("window").width);
  const tabWidth = pillWidth / TAB_COUNT;
  const indicatorPos = useSharedValue(indicatorX(TAB_ORDER.indexOf(active), tabWidth));

  useEffect(() => {
    indicatorPos.value = withTiming(indicatorX(TAB_ORDER.indexOf(active), tabWidth), {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [active, tabWidth, indicatorPos]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPos.value }],
  }));

  const handlePress = (tab: NavTab) => {
    if (tab === active) return;
    const target = TAB_ROUTES[tab];
    if (!target) return;
    if (tab === "home") router.replace(target as never);
    else router.push(target as never);
  };

  return (
    <Animated.View style={styles.wrapper}>
      <View style={styles.pillShadow}>
        <View
          style={styles.pill}
          onLayout={(e) => setPillWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.indicator, indicatorStyle]} />
          {TAB_ORDER.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => handlePress(tab)}
              activeOpacity={0.9}
            >
              <TabIcon tab={tab} active={active === tab} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={[styles.navBarFill, { height: insets.bottom }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navBarFill: {
    backgroundColor: colors.primary,
  },
  pillShadow: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  },
  pill: {
    height: PILL_HEIGHT,
    backgroundColor: colors.primary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: (PILL_HEIGHT - INDICATOR_SIZE) / 2,
    left: 0,
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.offWhite,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
});
