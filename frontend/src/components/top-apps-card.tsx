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

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, "0")}`;
}

export type AppUsage = { name: string; minutes: number };

type Props = { apps: AppUsage[] };

export function TopAppsCard({ apps }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.title_row}>
        <PhoneIcon />
        <Text style={styles.title}>Applications les plus utilisées</Text>
      </View>
      {apps.map((app) => (
        <View key={app.name} style={styles.app_row}>
          <Text style={styles.app_name}>{app.name}</Text>
          <Text style={styles.app_time}>{formatMinutes(app.minutes)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textDark,
  },
  app_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  app_name: {
    fontSize: 14,
    color: colors.textDark,
  },
  app_time: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
});
