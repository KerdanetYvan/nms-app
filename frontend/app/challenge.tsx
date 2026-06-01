import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme/colors";

export default function Challenge() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { context, label } = useLocalSearchParams<{ context: string; label: string }>();
  const [challenge, setChallenge] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadChallenge = useCallback(
    async (exclude?: string) => {
      if (!context) return;
      setLoading(true);
      setError(false);
      try {
        const data = await api.getChallenge(context, exclude);
        setChallenge(data.challenge);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [context],
  );

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const onShuffle = () => {
    Haptics.selectionAsync();
    loadChallenge(challenge ?? undefined);
  };

  const onStart = () => {
    if (!challenge) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/answer",
      params: { context, label, challenge },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="challenge-screen">
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="challenge-back"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPlum} />
        </TouchableOpacity>
        <Text style={styles.brand}>Doo</Text>
        <TouchableOpacity
          style={styles.shuffleBtn}
          onPress={onShuffle}
          testID="challenge-shuffle"
          hitSlop={12}
        >
          <Ionicons name="shuffle" size={22} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {!!label && (
          <View style={styles.contextPill}>
            <Text style={styles.contextPillText}>{label}</Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.challengeText}>Oups, impossible de charger le défi.</Text>
            <TouchableOpacity onPress={() => loadChallenge()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.Text
            key={challenge}
            entering={Platform.OS === "web" ? undefined : FadeIn.duration(350)}
            style={styles.challengeText}
            testID="challenge-text"
          >
            {challenge}
          </Animated.Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.startBtn, { marginBottom: insets.bottom + spacing.md }]}
        onPress={onStart}
        disabled={loading || error}
        activeOpacity={0.85}
        testID="start-challenge-button"
      >
        <Text style={styles.startBtnText}>Commencer le défi !</Text>
      </TouchableOpacity>
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
    justifyContent: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  brand: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.textPlum,
    letterSpacing: 1,
  },
  backBtn: {
    position: "absolute",
    left: 0,
    top: spacing.md,
    padding: spacing.xs,
  },
  shuffleBtn: {
    position: "absolute",
    right: 0,
    top: spacing.md,
    padding: spacing.xs,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
  },
  contextPill: {
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.xl,
  },
  contextPillText: {
    color: colors.textDark,
    fontWeight: "600",
    fontSize: 13,
  },
  challengeText: {
    fontSize: 30,
    lineHeight: 42,
    fontWeight: "700",
    color: colors.textPlum,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.offWhite,
  },
  retryText: {
    color: colors.textDark,
    fontWeight: "600",
  },
  startBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radius.md,
    alignItems: "center",
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  startBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
});
