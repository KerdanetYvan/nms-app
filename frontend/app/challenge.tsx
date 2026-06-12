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
import Svg, { Circle, Ellipse } from "react-native-svg";

import { api } from "@/src/api/client";
import { BottomNav } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";

function EyesLogo({ size = 120 }: { size?: number }) {
  const height = Math.round((size * 60) / 109);
  return (
    <Svg width={size} height={height} viewBox="0 0 109 60" fill="none">
      <Ellipse cx="29.4134" cy="29.5703" rx="24.9134" ry="25.0703" fill="white" stroke="#7A6678" strokeWidth="9" />
      <Circle cx="46.5277" cy="29.5277" r="8.02766" fill="#7A6678" />
      <Ellipse cx="79.5863" cy="29.5703" rx="24.9134" ry="25.0703" fill="white" stroke="#7A6678" strokeWidth="9" />
      <Circle cx="96.7005" cy="29.5277" r="8.02766" fill="#7A6678" />
    </Svg>
  );
}

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
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        testID="challenge-back"
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={26} color={colors.textPlum} />
      </TouchableOpacity>

      <View style={styles.body}>
        <EyesLogo size={120} />

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
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

      <View style={[styles.footer, { marginBottom: insets.bottom + 86 }]}>
        <TouchableOpacity
          style={[styles.startBtn, (loading || error) && styles.startBtnDisabled]}
          onPress={onStart}
          disabled={loading || error}
          activeOpacity={0.85}
          testID="start-challenge-button"
        >
          <Text style={styles.startBtnText}>Commencer le défi !</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onShuffle}
          style={styles.shuffleLink}
          disabled={loading}
          testID="challenge-shuffle"
          hitSlop={8}
        >
          <Text style={styles.shuffleLinkText}>← faire un autre défi</Text>
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
  backBtn: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    padding: spacing.xs,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  loader: {
    marginTop: spacing.lg,
  },
  center: {
    alignItems: "center",
  },
  challengeText: {
    fontSize: 26,
    lineHeight: 38,
    fontWeight: "600",
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
  footer: {
    alignItems: "center",
    gap: spacing.md,
  },
  startBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radius.md,
    alignItems: "center",
    alignSelf: "stretch",
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  startBtnDisabled: {
    opacity: 0.5,
  },
  startBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  shuffleLink: {
    paddingVertical: spacing.xs,
  },
  shuffleLinkText: {
    color: colors.textPlum,
    fontSize: 14,
    fontWeight: "500",
  },
});
