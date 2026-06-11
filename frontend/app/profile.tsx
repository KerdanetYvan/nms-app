import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { useAuth } from "@/src/hooks/use-auth";
import { BottomNav, NavTab } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";

const TOTAL_DAYS = 96;
const STREAK_DAYS = 25;
const POINTS = 40;
const DAYS_TO_GOLD = 16;

type Badge = { key: string; icon: string; color: string };

const BADGES: Badge[] = [
  { key: "bronze", icon: "trophy", color: "#C07830" },
  { key: "argent", icon: "trophy", color: "#A09098" },
  { key: "or", icon: "trophy-outline", color: "#8BB5C0" },
  { key: "platine", icon: "trophy-outline", color: "#8BB5C0" },
];

function cap(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDayHeader(date: Date): string {
  const day = cap(format(date, "EEE", { locale: fr }).replace(".", ""));
  const num = format(date, "d");
  const month = cap(format(date, "MMMM", { locale: fr }));
  return `${day}, ${num} ${month}`;
}

function formatJoinDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${format(d, "d")} ${cap(format(d, "MMMM", { locale: fr }))} ${format(d, "yyyy")}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    "Utilisateur";

  const joinDate = user?.created_at ? formatJoinDate(user.created_at) : "";
  const todayLabel = formatDayHeader(new Date());

  const handleTabPress = (tab: NavTab) => {
    if (tab === "home") router.replace("/");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{todayLabel}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{POINTS} 🔥</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: insets.bottom + 94 }}
      >
        {/* Avatar + identité */}
        <Animated.View
          entering={FadeInDown.delay(40).duration(380)}
          style={styles.avatarSection}
        >
          <Text style={styles.name}>{displayName}</Text>
          {joinDate ? (
            <Text style={styles.joinDate}>Tu as rejoint Doo le {joinDate}</Text>
          ) : null}
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(110).duration(380)}
          style={styles.card}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="calendar-check-outline"
                size={22}
                color={colors.offWhite}
              />
              <Text style={styles.statValue}>{TOTAL_DAYS}</Text>
              <Text style={styles.statLabel}>Total de jours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="reload"
                size={22}
                color={colors.offWhite}
              />
              <Text style={styles.statValue}>{STREAK_DAYS}</Text>
              <Text style={styles.statLabel}>Séries de jours</Text>
            </View>
          </View>
        </Animated.View>

        {/* Badges */}
        <Animated.View
          entering={FadeInDown.delay(180).duration(380)}
          style={styles.card}
        >
          <View style={styles.trophyRow}>
            {BADGES.map((b) => (
              <MaterialCommunityIcons
                key={b.key}
                name={b.icon as never}
                size={38}
                color={b.color}
              />
            ))}
          </View>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>Badge d'argent</Text>
          </View>
          <Text style={styles.badgeHint}>
            Encore {DAYS_TO_GOLD} jours pour le badge d'or
          </Text>
        </Animated.View>

        {/* Infos personnelles */}
        <Animated.View entering={FadeInDown.delay(250).duration(380)}>
          <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={() => router.push("/personal-info")}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={22}
                color={colors.offWhite}
              />
              <Text style={styles.infoLabel}>Mes informations personnelles</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color="rgba(255,255,255,0.4)"
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <BottomNav active="user" onPress={handleTabPress} />
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  pill: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  pillText: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: "600",
  },
  avatarSection: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPlum,
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 13,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 52,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  trophyRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  badgePill: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    marginBottom: spacing.sm,
  },
  badgePillText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  badgeHint: {
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  infoLabel: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
});
