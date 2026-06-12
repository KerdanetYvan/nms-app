import { useCallback, useEffect, useState } from "react";
import { Linking, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { ensureNotificationPermission, getPermissionState } from "@/src/utils/notifications";
import { BottomNav } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";

type PermState = { granted: boolean; canAskAgain: boolean };

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [perm, setPerm] = useState<PermState>({ granted: false, canAskAgain: true });
  const [loading, setLoading] = useState(false);

  const refreshPerm = useCallback(async () => {
    const state = await getPermissionState();
    setPerm(state);
  }, []);

  useEffect(() => {
    refreshPerm();
  }, [refreshPerm]);

  const handleToggle = async () => {
    if (Platform.OS === "web") return;
    if (perm.granted) {
      Linking.openSettings();
      return;
    }
    if (perm.canAskAgain) {
      setLoading(true);
      const granted = await ensureNotificationPermission();
      setPerm((p) => ({ ...p, granted }));
      setLoading(false);
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPlum} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <View style={styles.explainCard}>
        <Ionicons name="notifications-outline" size={28} color={colors.primary} style={styles.explainIcon} />
        <Text style={styles.explainTitle}>Pourquoi des notifications ?</Text>
        <Text style={styles.explainBody}>
          Doo t'envoie un rappel après un certain temps de scroll continu.{"\n\n"}
          L'objectif n'est pas de te surveiller, mais de te donner un signal pour reprendre
          conscience de ce que tu fais — et décider toi-même si tu veux continuer.
        </Text>
      </View>

      <View style={styles.toggleCard}>
        <Text style={styles.toggleLabel}>
          {perm.granted ? "Notifications activées" : "Notifications désactivées"}
        </Text>
        <Switch
          value={perm.granted}
          onValueChange={handleToggle}
          disabled={loading}
          trackColor={{ false: colors.beige, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      {!perm.granted && !perm.canAskAgain && (
        <Text style={styles.hint}>
          La permission a été refusée. Active les notifications depuis les réglages de ton téléphone.
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
