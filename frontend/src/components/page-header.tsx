import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { api } from "@/src/api/client";
import { DooLogo } from "./doo-logo";
import { colors, radius, spacing } from "@/src/theme/colors";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS   = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

function formatDate(): string {
  const d = new Date();
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function FlameIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.white} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
    </Svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PageHeader() {
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    api.getAnswers()
      .then((answers) => setPoints(answers.length))
      .catch(() => {});
  }, []);

  return (
    <View style={styles.header}>
      <View style={styles.col}>
        <View style={styles.badge}>
          <Text style={styles.badge_text}>{formatDate()}</Text>
        </View>
      </View>

      <DooLogo width={150} />

      <View style={[styles.col, styles.col_right]}>
        {points !== null && (
          <View style={styles.badge}>
            <Text style={styles.badge_text}>{points}</Text>
            <FlameIcon />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  col: {
    flex: 1,
  },
  col_right: {
    alignItems: "flex-end",
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badge_text: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
  },
});
