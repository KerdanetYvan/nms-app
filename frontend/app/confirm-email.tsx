import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { supabase } from "@/src/lib/supabase";
import { DooLogo } from "@/src/components/doo-logo";
import { colors, radius, spacing } from "@/src/theme/colors";

const CODE_LENGTH = 6;

export default function ConfirmEmail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleDigit = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, "");
    // Gère le cas où l'utilisateur colle les 6 chiffres d'un coup
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, CODE_LENGTH);
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length; i++) newDigits[i] = pasted[i];
      setDigits(newDigits);
      inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
      return;
    }
    const char = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError(null);
    if (char && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const token = digits.join("");
    if (token.length < CODE_LENGTH) { setError("Saisis les 6 chiffres du code."); return; }
    if (!email) return;
    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { error: err } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
      if (err) throw err;
      router.replace("/");
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : "Code invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResent(false);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { error: err } = await supabase.auth.resend({ type: "signup", email });
      if (err) throw err;
      setResent(true);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setResending(false);
    }
  };

  const isComplete = digits.every((d) => d !== "");

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {!keyboardVisible && (
        <Animated.View
          style={styles.logoZone}
          entering={Platform.OS === "web" ? undefined : FadeInDown.delay(0).springify()}
        >
          <DooLogo width={160} />
        </Animated.View>
      )}

      <Animated.View
        style={styles.content}
        entering={Platform.OS === "web" ? undefined : FadeInDown.delay(100).springify()}
      >
        <Text style={styles.title}>Vérifie ta boîte mail</Text>

        <Text style={styles.body}>
          On a envoyé un code à 6 chiffres à{"\n"}
          <Text style={styles.emailHighlight}>{email ?? "ton adresse e-mail"}</Text>.
        </Text>

        <View style={styles.codeRow}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              style={[styles.codeBox, !!digit && styles.codeBoxFilled]}
              value={digit}
              onChangeText={(text) => handleDigit(text, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              caretHidden
            />
          ))}
        </View>

        {error && (
          <Animated.Text
            entering={Platform.OS === "web" ? undefined : FadeInDown.duration(200)}
            style={styles.errorText}
          >
            {error}
          </Animated.Text>
        )}
      </Animated.View>

      <Animated.View
        style={styles.actions}
        entering={Platform.OS === "web" ? undefined : FadeInDown.delay(200).springify()}
      >
        <TouchableOpacity
          style={[styles.btn, !isComplete && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading || !isComplete}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>Confirmer mon e-mail</Text>
          )}
        </TouchableOpacity>

        {resent ? (
          <Text style={styles.resentText}>Code renvoyé !</Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={resending} hitSlop={10}>
            {resending
              ? <ActivityIndicator color={colors.primary} />
              : <Text style={styles.resendLink}>Renvoyer le code</Text>
            }
          </TouchableOpacity>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  logoZone: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPlum,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 24,
  },
  emailHighlight: {
    color: colors.textPlum,
    fontWeight: "700",
  },
  codeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  codeBox: {
    width: 44,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.beige,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPlum,
    backgroundColor: colors.white,
  },
  codeBoxFilled: {
    borderColor: colors.primary,
  },
  errorText: {
    fontSize: 13,
    color: "#C0504D",
    textAlign: "center",
    fontWeight: "500",
  },
  actions: {
    gap: spacing.md,
    alignItems: "center",
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    alignSelf: "stretch",
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  resendLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  resentText: {
    fontSize: 14,
    color: "#52B788",
    fontWeight: "600",
  },
});
