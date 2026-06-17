import { useCallback, useEffect } from "react";
import { AppState, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAppSurveillance } from "@/src/hooks/use-app-surveillance";
import { BottomNav } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";

export default function AppSurveillanceSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isGranted, refresh, openSettings } = useAppSurveillance();

  const handleFocus = useCallback(() => {
    refresh();
  }, [refresh]);

  // Rafraîchit la permission quand l'utilisateur revient depuis les paramètres système
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const handleToggle = () => {
    openSettings();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPlum} />
        </TouchableOpacity>
        <Text style={styles.title}>Surveillance d'apps</Text>
      </View>

      <View style={styles.explainCard}>
        <Ionicons name="bar-chart-outline" size={28} color={colors.primary} style={styles.explainIcon} />
        <Text style={styles.explainTitle}>Pourquoi cette permission ?</Text>
        <Text style={styles.explainBody}>
          Doo mesure le temps que tu passes sur tes apps choisies pendant l'onboarding.{"\n\n"}
          Ces données restent sur ton téléphone — elles ne sont jamais partagées ni envoyées à nos serveurs. Cette permission sert uniquement à afficher ton temps d'écran dans l'app.
        </Text>
      </View>

      <View style={styles.toggleCard}>
        <Text style={styles.toggleLabel}>
          {isGranted ? "Accès activé" : "Accès désactivé"}
        </Text>
        <Switch
          value={isGranted}
          onValueChange={handleToggle}
          trackColor={{ false: colors.beige, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      {!isGranted && (
        <Text style={styles.hint}>
          Active l'accès depuis Paramètres → Accès aux données d'utilisation → Doo.
        </Text>
      )}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPlum,
  },
  explainCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  explainIcon: {
    alignSelf: "flex-start",
  },
  explainTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPlum,
  },
  explainBody: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
