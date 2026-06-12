import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api/client";
import { DooLogo } from "@/src/components/doo-logo";
import { colors, radius, spacing } from "@/src/theme/colors";

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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          testID="answer-back"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPlum} />
        </TouchableOpacity>
        <DooLogo width={120} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={16}
      >
        <View style={styles.body}>
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

              {!!challenge && <Text style={styles.challengeHint}>{challenge}</Text>}

              <TextInput
                style={styles.input}
                placeholder="j'ai vu 4 voitures jaunes..."
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
          style={[styles.backLink, { marginBottom: insets.bottom + spacing.md }]}
          onPress={() => router.back()}
          testID="back-to-challenge-link"
          hitSlop={10}
        >
          <Text style={styles.backLinkText}>Retour au défi </Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textDark} />
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
  body: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.yellow,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPlum,
    marginBottom: spacing.md,
  },
  challengeHint: {
    fontSize: 14,
    color: colors.textDark,
    textAlign: "center",
    marginBottom: spacing.md,
    fontStyle: "italic",
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
    marginBottom: spacing.lg,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
