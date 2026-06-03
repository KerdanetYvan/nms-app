import { useRouter } from "expo-router";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { supabase } from "@/src/lib/supabase";
import { colors, radius, spacing } from "@/src/theme/colors";

type Mode = "login" | "register";

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = () => {
    Haptics.selectionAsync();
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
  };

  const onSubmit = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError("Remplis tous les champs.");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
      }
      router.replace("/");
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      testID="auth-screen"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={16}
      >
        <View style={styles.inner}>
          {/* Header */}
          <Animated.View
            entering={Platform.OS === "web" ? undefined : FadeInDown.delay(0).springify()}
          >
            <Text style={styles.brand}>Doo</Text>
            <Text style={styles.tagline}>
              {isLogin
                ? "Content de te revoir !"
                : "Rejoins ceux qui résistent au scroll."}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={styles.form}
            entering={Platform.OS === "web" ? undefined : FadeInDown.delay(80).springify()}
          >
            <Text style={styles.label}>Adresse e-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="toi@exemple.com"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              testID="auth-email-input"
            />

            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isLogin ? "current-password" : "new-password"}
              testID="auth-password-input"
            />

            {!isLogin && (
              <Animated.View
                entering={Platform.OS === "web" ? undefined : FadeInDown.duration(250)}
              >
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  testID="auth-confirm-password-input"
                />
              </Animated.View>
            )}

            {error && (
              <Animated.Text
                entering={Platform.OS === "web" ? undefined : FadeInDown.duration(200)}
                style={styles.errorText}
                testID="auth-error"
              >
                {error}
              </Animated.Text>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.85}
              testID="auth-submit-button"
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isLogin ? "Se connecter" : "Créer mon compte"}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Toggle mode */}
          <Animated.View
            style={styles.switchRow}
            entering={Platform.OS === "web" ? undefined : FadeInDown.delay(160).springify()}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
            </Text>
            <TouchableOpacity onPress={switchMode} hitSlop={10} testID="auth-mode-toggle">
              <Text style={styles.switchLink}>
                {isLogin ? "S'inscrire" : "Se connecter"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
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
  inner: {
    flex: 1,
    justifyContent: "center",
  },
  brand: {
    fontSize: 42,
    fontWeight: "800",
    color: colors.textPlum,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.xl,
    fontWeight: "500",
  },
  form: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: "#C0504D",
    textAlign: "center",
    marginBottom: spacing.md,
    fontWeight: "500",
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
  },
  switchText: {
    fontSize: 14,
    color: colors.muted,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
