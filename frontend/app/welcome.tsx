import { useRouter } from "expo-router";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { colors, radius, spacing } from "@/src/theme/colors";

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/auth?mode=register" as never);
  };

  const goLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/auth?mode=login" as never);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      {/* Logo — 40% */}
      <Animated.View
        style={styles.logoZone}
        entering={Platform.OS === "web" ? undefined : FadeInDown.delay(0).springify()}
      >
        <Image source={require("@/assets/images/logo_doo.png")} />
      </Animated.View>

      {/* Boutons — ~28% */}
      <Animated.View
        style={styles.actionsZone}
        entering={Platform.OS === "web" ? undefined : FadeInDown.delay(160).springify()}
      >
        <TouchableOpacity style={styles.btnPrimary} onPress={goRegister} activeOpacity={0.85}>
          <Text style={styles.btnPrimaryText}>Créer un compte</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={goLogin} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  logoZone: {
    flex: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  tagline: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.md,
    fontWeight: "500",
    lineHeight: 24,
  },
  actionsZone: {
    flex: 3,
    justifyContent: "flex-start",
    gap: spacing.sm,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  btnSecondary: {
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnSecondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  spacer: {
    flex: 3,
  },
});
