import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
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

import { Ionicons } from "@expo/vector-icons";
import { DooLogo } from "@/src/components/doo-logo";

import { supabase } from "@/src/lib/supabase";
import { colors, radius, spacing } from "@/src/theme/colors";

type Mode = "login" | "register";

function check_password(pwd: string) {
  return {
    length: pwd.length >= 8,
    uppercase: (pwd.match(/[A-Z]/g) ?? []).length >= 2,
    lowercase: (pwd.match(/[a-z]/g) ?? []).length >= 2,
    special: /[^a-zA-Z0-9]/.test(pwd),
  };
}

function strength_score(pwd: string): number {
  const c = check_password(pwd);
  return [c.length, c.uppercase, c.lowercase, c.special].filter(Boolean).length;
}

function strength_color(score: number): string {
  if (score <= 1) return "#E05252";
  if (score === 2) return "#E0963A";
  if (score === 3) return "#E0C43A";
  return "#52B788";
}

const CRITERIA = [
  { key: "length" as const, label: "8 caractères minimum" },
  { key: "uppercase" as const, label: "2 lettres majuscules" },
  { key: "lowercase" as const, label: "2 lettres minuscules" },
  { key: "special" as const, label: "1 caractère spécial" },
];

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode: initialMode } = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<Mode>(initialMode === "register" ? "register" : "login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    if (mode === "register") {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Remplis tous les champs.");
        return;
      }
      const c = check_password(password);
      if (!c.length || !c.uppercase || !c.lowercase || !c.special) {
        setError("Le mot de passe ne respecte pas les critères.");
        return;
      }
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName.trim(), last_name: lastName.trim() },
          },
        });
        if (err) throw err;
        router.replace(`/confirm-email?email=${encodeURIComponent(email)}` as never);
        return;
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
  const score = strength_score(password);
  const criteria = check_password(password);
  const showStrength = !isLogin;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={16}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View
            style={styles.logoZone}
            entering={Platform.OS === "web" ? undefined : FadeInDown.delay(0).springify()}
          >
            <DooLogo width={160} />
          </Animated.View>

          {/* Champs */}
          <Animated.View
            entering={Platform.OS === "web" ? undefined : FadeInDown.delay(80).springify()}
          >
            {!isLogin && (
              <>
                <Text style={styles.label}>Nom</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dupont"
                  placeholderTextColor={colors.muted}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoComplete="family-name"
                />

                <Text style={styles.label}>Prénom</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jean"
                  placeholderTextColor={colors.muted}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoComplete="given-name"
                />
              </>
            )}

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
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.inputPassword]}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={isLogin ? "current-password" : "new-password"}
                testID="auth-password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={10}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.muted}
                />
              </TouchableOpacity>
            </View>

            {showStrength && (
              <Animated.View
                entering={Platform.OS === "web" ? undefined : FadeInDown.duration(200)}
              >
                <View style={styles.strengthBar}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        i < score && { backgroundColor: strength_color(score) },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.criteriaList}>
                  {CRITERIA.map(({ key, label }) => (
                    <Text
                      key={key}
                      style={[styles.criteriaItem, criteria[key] && styles.criteriaItemMet]}
                    >
                      {criteria[key] ? "✓" : "✗"} {label}
                    </Text>
                  ))}
                </View>
              </Animated.View>
            )}
          </Animated.View>

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

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
            </Text>
            <TouchableOpacity onPress={switchMode} hitSlop={10} testID="auth-mode-toggle">
              <Text style={styles.switchLink}>
                {isLogin ? "S'inscrire" : "Se connecter"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: spacing.xl,
  },
  logoZone: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 13,
    fontFamily: "Quicksand_400Regular",
    color: "#000000",
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: "transparent",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#7A6678",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  inputRow: {
    marginBottom: spacing.md,
  },
  inputPassword: {
    paddingRight: 48,
    marginBottom: 0,
  },
  eyeBtn: {
    position: "absolute",
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  strengthBar: {
    flexDirection: "row",
    gap: 4,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.beige,
  },
  criteriaList: {
    gap: 6,
    marginBottom: spacing.md,
  },
  criteriaItem: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  criteriaItemMet: {
    color: "#52B788",
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
    marginBottom: spacing.lg,
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
