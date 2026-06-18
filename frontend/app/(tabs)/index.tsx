import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Svg, { Path, Rect as SvgRect } from "react-native-svg";

import { api } from "@/src/api/client";
import { DooLogo } from "@/src/components/doo-logo";
import { BottomNav } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";

// ─── SVG icons ────────────────────────────────────────────────────────────────

type IconProps = { color: string; size?: number };

function CoffeeIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10 2v2" />
      <Path d="M14 2v2" />
      <Path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
      <Path d="M6 2v2" />
    </Svg>
  );
}

function MetroIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <SvgRect width={16} height={16} x={4} y={3} rx={2} stroke={color} fill="none" />
      <Path d="M4 11h16" />
      <Path d="M12 3v8" />
      <Path d="m8 19-2 3" />
      <Path d="m18 22-2-3" />
      <Path d="M8 15h.01" />
      <Path d="M16 15h.01" />
    </Svg>
  );
}

function BedIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <Path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <Path d="M12 4v6" />
      <Path d="M2 18h20" />
    </Svg>
  );
}

function ChairIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m15 13 3.708 7.416" />
      <Path d="M3 19a15 15 0 0 0 18 0" />
      <Path d="m3 2 3.21 9.633A2 2 0 0 0 8.109 13H18" />
      <Path d="m9 13-3.708 7.416" />
    </Svg>
  );
}

function HouseIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <Path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Svg>
  );
}

function BusIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 6 2 7" />
      <Path d="M10 6h4" />
      <Path d="m22 7-2-1" />
      <SvgRect width={16} height={16} x={4} y={3} rx={2} stroke={color} fill="none" />
      <Path d="M4 11h16" />
      <Path d="M8 15h.01" />
      <Path d="M16 15h.01" />
      <Path d="M6 19v2" />
      <Path d="M18 21v-2" />
    </Svg>
  );
}

// ─── Context buttons ──────────────────────────────────────────────────────────

type ContextKey = "pause" | "metro" | "lit" | "salle_attente" | "maison" | "bus";

type ContextButton = {
  key: ContextKey;
  label: string;
  bg: string;
  textColor: string;
};

const CONTEXT_BUTTONS: ContextButton[] = [
  { key: "pause",        label: "Je suis en pause",                bg: colors.secondary, textColor: colors.textDark },
  { key: "metro",        label: "Je suis dans le métro",           bg: colors.beige,     textColor: colors.textDark },
  { key: "lit",          label: "Je suis dans mon lit",            bg: colors.rose,      textColor: colors.textDark },
  { key: "salle_attente",label: "Je suis dans la salle d'attente", bg: colors.yellow,    textColor: colors.textDark },
  { key: "maison",       label: "Je suis à la maison",             bg: colors.offWhite,  textColor: colors.textDark },
  { key: "bus",          label: "Je suis dans le bus",             bg: colors.primary,   textColor: colors.white    },
];

function ContextIcon({ contextKey, color }: { contextKey: ContextKey; color: string }) {
  if (contextKey === "pause")         return <CoffeeIcon color={color} />;
  if (contextKey === "metro")         return <MetroIcon color={color} />;
  if (contextKey === "lit")           return <BedIcon color={color} />;
  if (contextKey === "salle_attente") return <ChairIcon color={color} />;
  if (contextKey === "maison")        return <HouseIcon color={color} />;
  return <BusIcon color={color} />;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    api.getUserProfile()
      .then((profile) => {
        if (!profile) {
          router.replace("/onboarding" as unknown as Href);
        } else {
          setProfileChecked(true);
        }
      })
      .catch(() => setProfileChecked(true));
  }, []);

  const onSelectContext = (btn: ContextButton) => {
    Haptics.selectionAsync();
    router.push({
      pathname: "/challenge",
      params: { context: btn.key, label: btn.label },
    });
  };

  if (!profileChecked) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="home-screen">
      <View style={styles.header}>
        <DooLogo width={150} />
      </View>

      {/* Greeting */}
      <Text style={styles.subtitle} testID="home-subtitle">
        Salut !{"\n"}Que se passe t-il autour de toi ?
      </Text>

      {/* Context buttons */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + 94 }}
        showsVerticalScrollIndicator={false}
      >
        {CONTEXT_BUTTONS.map((btn, i) => (
          <Animated.View
            key={btn.key}
            entering={Platform.OS === "web" ? undefined : FadeInDown.delay(i * 60).springify()}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.ctx_btn, { backgroundColor: btn.bg }]}
              onPress={() => onSelectContext(btn)}
              testID={`context-button-${btn.key}`}
            >
              <Text style={[styles.ctx_label, { color: btn.textColor }]}>{btn.label}</Text>
              <ContextIcon contextKey={btn.key} color={btn.textColor} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },

  header: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Greeting
  subtitle: {
    fontSize: 20,
    lineHeight: 30,
    color: colors.textDark,
    fontWeight: "700",
    marginBottom: spacing.md,
  },

  // Buttons
  list: {
    flex: 1,
  },
  ctx_btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
  },
  ctx_label: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    marginRight: spacing.sm,
  },
});
