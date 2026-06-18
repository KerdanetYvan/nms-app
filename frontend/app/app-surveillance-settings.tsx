import { useCallback, useEffect, useState } from "react";
import { AppState, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAppSurveillance } from "@/src/hooks/use-app-surveillance";
import { BottomNav } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";
import { isBatteryOptimizationIgnored, requestIgnoreBatteryOptimization } from "usage-stats";

export default function AppSurveillanceSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isGranted, refresh, openSettings } = useAppSurveillance();
  const [isBatteryExempt, setIsBatteryExempt] = useState(() => isBatteryOptimizationIgnored());

  const refreshBatteryStatus = useCallback(() => {
    setIsBatteryExempt(isBatteryOptimizationIgnored());
  }, []);

  // Rafraîchit permission et statut batterie quand l'utilisateur revient depuis les paramètres système
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
        refreshBatteryStatus();
      }
    });
    return () => sub.remove();
  }, [refresh, refreshBatteryStatus]);

  const handleToggle = () => {
    openSettings();
  };

  const handleBatteryOptimization = () => {
    requestIgnoreBatteryOptimization();
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

      <View style={styles.toggleCard}>
        <View style={styles.batteryRow}>
          <Ionicons
            name="battery-charging-outline"
            size={20}
            color={isBatteryExempt ? colors.primary : colors.secondary}
          />
          <Text style={styles.toggleLabel}>
            {isBatteryExempt ? "Surveillance en arrière-plan active" : "Optimisation batterie active"}
          </Text>
        </View>
        {!isBatteryExempt && (
          <TouchableOpacity onPress={handleBatteryOptimization} style={styles.batteryBtn}>
            <Text style={styles.batteryBtnText}>Désactiver</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isBatteryExempt && (
        <Text style={styles.hint}>
          Sans cette exemption, la surveillance peut s'arrêter quand tu quittes l'app.
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
    marginBottom: spacing.md,
  },
  batteryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 1,
  },
  batteryBtn: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  batteryBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
  },
});
