import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Ellipse } from "react-native-svg";

import { api } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme/colors";

function EyesLookingDown({ size = 109 }: { size?: number }) {
  const height = Math.round((size * 60) / 109);
  return (
    <Svg width={size} height={height} viewBox="0 0 109 60" fill="none">
      <Ellipse cx="29.4134" cy="29.5703" rx="24.9134" ry="25.0703" fill="white" stroke="#7A6678" strokeWidth="9" />
      <Circle cx="30.1418" cy="44.5277" r="8.02766" fill="#7A6678" />
      <Ellipse cx="79.5865" cy="29.5703" rx="24.9134" ry="25.0703" fill="white" stroke="#7A6678" strokeWidth="9" />
      <Circle cx="80.3145" cy="44.5277" r="8.02766" fill="#7A6678" />
    </Svg>
  );
}

export default function Answer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { context, challenge } = useLocalSearchParams<{
    context: string;
    challenge: string;
  }>();
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const onValidate = async () => {
    if (!answer.trim() || saving) return;
    setSaving(true);
    try {
      await api.saveAnswer({
        context: context ?? "",
        challenge: challenge ?? "",
        answer: answer.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="answer-screen">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={16}
      >
        <View style={styles.body}>
          <EyesLookingDown size={120} />

          {done ? (
            <Animated.View
              entering={Platform.OS === "web" ? undefined : FadeIn}
              style={styles.card}
              testID="answer-success-card"
            >
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={34} color={colors.white} />
              </View>
              <Text style={styles.cardTitle}>Bravo !</Text>
              <Text style={styles.successText}>
                Ta réponse est enregistrée. Tu as gagné contre le scroll.
              </Text>
              <TouchableOpacity
                style={styles.validateBtn}
                onPress={() => router.replace("/")}
                testID="back-home-button"
              >
                <Text style={styles.validateText}>Retour à l&apos;accueil</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.card} testID="answer-card">
              <Text style={styles.cardTitle}>Donner ma réponse</Text>

              <TextInput
                style={styles.input}
                placeholder="J'ai vu 4 voitures jaunes..."
                placeholderTextColor={colors.muted}
                value={answer}
                onChangeText={setAnswer}
                multiline
                testID="answer-input"
              />

              <TouchableOpacity
                style={[styles.validateBtn, (!answer.trim() || saving) && styles.disabled]}
                onPress={onValidate}
                disabled={!answer.trim() || saving}
                activeOpacity={0.85}
                testID="validate-answer-button"
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.validateText}>Valider ma réponse</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {!done && (
        <TouchableOpacity
          style={[styles.backLink, { marginBottom: insets.bottom + spacing.lg }]}
          onPress={() => router.back()}
          testID="back-to-challenge-link"
          hitSlop={10}
        >
          <Text style={styles.backLinkText}>← Retour au défi</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    alignSelf: "stretch",
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPlum,
    marginBottom: spacing.md,
  },
  input: {
    width: "100%",
    minHeight: 88,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 15,
    color: colors.textDark,
    marginBottom: spacing.md,
    textAlignVertical: "top",
  },
  validateBtn: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
  },
  validateText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textDark,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  backLink: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    fontSize: 15,
    color: colors.textPlum,
    fontWeight: "500",
  },
});
