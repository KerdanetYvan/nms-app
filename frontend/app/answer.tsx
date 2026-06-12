import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

import { api } from "@/src/api/client";
import { colors, radius, spacing } from "@/src/theme/colors";

function EyesSmiling({ size = 109 }: { size?: number }) {
  const height = Math.round((size * 97) / 109);
  return (
    <Svg width={size} height={height} viewBox="0 0 109 97" fill="none">
      <Ellipse cx="29.4134" cy="29.5703" rx="24.9134" ry="25.0703" fill="white" stroke="#7A6678" strokeWidth="9" />
      <Circle cx="17.5277" cy="21.5277" r="8.02766" fill="#7A6678" />
      <Ellipse cx="79.5865" cy="29.5703" rx="24.9134" ry="25.0703" fill="white" stroke="#7A6678" strokeWidth="9" />
      <Circle cx="67.7003" cy="21.5277" r="8.02766" fill="#7A6678" />
      <Path
        d="M9.5 69.9C9.5 68.8333 9.9 68 10.7 67.4C11.5 66.8 12.3 66.5 13.1 66.5C14.2333 66.5 15.1667 67 15.9 68C18.7667 72.4667 22.2333 76.2 26.3 79.2C30.3 82.2667 34.7 84.5667 39.5 86.1C44.3 87.7 49.2 88.5 54.2 88.5C59.2 88.5 64.1 87.7333 68.9 86.2C73.7667 84.7333 78.2333 82.4667 82.3 79.4C86.3667 76.4 89.7333 72.6 92.4 68C93.0667 67 94.0333 66.5 95.3 66.5C96.1667 66.5 96.9667 66.8 97.7 67.4C98.4333 68.0667 98.8 68.9 98.8 69.9C98.8 70.5667 98.6 71.2 98.2 71.8C95.2 77.2667 91.4 81.8 86.8 85.4C82.2 89.0667 77.1 91.8333 71.5 93.7C65.9667 95.5667 60.2 96.5 54.2 96.5C48.2 96.5 42.4333 95.5333 36.9 93.6C31.4333 91.7333 26.4 88.9333 21.8 85.2C17.2 81.5333 13.3 77.0333 10.1 71.7C9.7 71.1667 9.5 70.5667 9.5 69.9Z"
        fill="#7A6678"
      />
    </Svg>
  );
}

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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { paddingTop: insets.top }]} testID="answer-screen">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={16}
        >
          <View style={styles.body}>
            {done ? (
              <Animated.View
                entering={Platform.OS === "web" ? undefined : FadeIn.duration(400)}
                style={styles.successContent}
                testID="answer-success-card"
              >
                <EyesSmiling size={120} />
                <View style={styles.successPill}>
                  <Text style={styles.successPillText}>Ta réponse à été validée</Text>
                </View>
              </Animated.View>
            ) : (
              <>
                <EyesLookingDown size={120} />
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
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.backLink, { marginBottom: insets.bottom + spacing.lg }]}
            onPress={() => router.back()}
            testID="back-to-challenge-link"
            hitSlop={10}
          >
            <Text style={styles.backLinkText}>← Retour au défi</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
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
  successContent: {
    alignItems: "center",
    gap: spacing.lg,
  },
  successPill: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  successPillText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
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
