import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect as SvgRect } from "react-native-svg";

import { colors, radius, spacing } from "@/src/theme/colors";

function PhoneIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke={colors.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <SvgRect width={14} height={20} x={5} y={2} rx={2} />
      <Path d="M12 18h.01" />
    </Svg>
  );
}

type Props = {
  deltaFromYesterday: number;
};

export function ScreenTimeCard({ deltaFromYesterday }: Props) {
  const sign = deltaFromYesterday > 0 ? "+" : "";
  const deltaLabel = `${sign}${deltaFromYesterday}min par rapport à hier`;

  return (
    <View style={styles.card}>
      <View style={styles.title_row}>
        <PhoneIcon />
        <Text style={styles.title}>Temps d'écran aujourd'hui</Text>
      </View>
      <Text style={styles.delta}>{deltaLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 6,
  },
  title_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  delta: {
    fontSize: 13,
    color: colors.muted,
    paddingLeft: 32,
  },
});
