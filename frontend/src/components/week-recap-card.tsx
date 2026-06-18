import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";

import { colors, radius, spacing } from "@/src/theme/colors";

function ArrowIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.textDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14" />
      <Path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

export function WeekRecapCard() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push("/week-recap")}
      activeOpacity={0.75}
    >
      <Text style={styles.label}>Voir mon récap de la semaine</Text>
      <ArrowIcon />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
});
