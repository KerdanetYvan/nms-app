import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/src/theme/colors";

type Props = {
  visible: boolean;
  onAllow: () => void;
  onLater: () => void;
};

export function UsagePermissionModal({ visible, onAllow, onLater }: Props) {
  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Ionicons name="bar-chart-outline" size={32} color={colors.primary} style={styles.icon} />
          <Text style={styles.title}>Surveille ton temps d'écran</Text>
          <Text style={styles.body}>
            Doo peut mesurer le temps que tu passes sur tes apps pour t'aider à tenir tes objectifs.{"\n\n"}
            Cette permission reste privée — aucune donnée n'est partagée.
          </Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={onAllow} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Autoriser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={onLater} activeOpacity={0.7}>
            <Text style={styles.btnSecondaryText}>Plus tard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: "100%",
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPlum,
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  btnSecondary: {
    paddingVertical: spacing.xs,
  },
  btnSecondaryText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
  },
});
