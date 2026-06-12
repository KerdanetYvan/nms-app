import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "@/src/lib/supabase";
import { BottomNav } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/welcome");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => router.push("/personal-info")}>
          <Text style={styles.rowLabel}>Informations personnelles</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.row} onPress={() => router.push("/notifications-settings")}>
          <Text style={styles.rowLabel}>Notifications</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => router.push("/terms")}>
          <Text style={styles.rowLabel}>Conditions d'utilisation</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.row} onPress={() => router.push("/privacy")}>
          <Text style={styles.rowLabel}>Confidentialité</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />

      <View style={[styles.signOutSection, { paddingBottom: insets.bottom + 94 + spacing.md }]}>
        <TouchableOpacity style={[styles.section, styles.row, styles.rowDestructive]} onPress={handleSignOut}>
          <Text style={styles.rowLabelDestructive}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPlum,
  },
  section: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  spacer: {
    flex: 1,
  },
  signOutSection: {
    marginBottom: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowDestructive: {
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  rowChevron: {
    fontSize: 20,
    color: colors.muted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.beige,
    marginHorizontal: spacing.lg,
  },
  rowLabelDestructive: {
    fontSize: 15,
    fontWeight: "600",
    color: "#C0504D",
  },
});
