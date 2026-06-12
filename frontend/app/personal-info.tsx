import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { useAuth } from "@/src/hooks/use-auth";
import { api } from "@/src/api/client";
import { supabase } from "@/src/lib/supabase";
import { BottomNav } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";

type FieldKey = "prenom" | "nom" | "date_naissance" | "telephone" | "email" | "password";

function UserSvg({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

function CakeSvg({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
      <Path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
      <Path d="M2 21h20" />
      <Path d="M7 8v3" />
      <Path d="M12 8v3" />
      <Path d="M17 8v3" />
      <Path d="M7 4h.01" />
      <Path d="M12 4h.01" />
      <Path d="M17 4h.01" />
    </Svg>
  );
}

function PhoneSvg({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
    </Svg>
  );
}

function MailSvg({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <Rect x={2} y={4} width={20} height={16} rx={2} />
    </Svg>
  );
}

function LockSvg({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={11} width={18} height={11} rx={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
  );
}

type FieldConfig = {
  key: FieldKey;
  label: string;
  renderIcon: (color: string) => ReactNode;
  secure?: boolean;
  keyboard?: KeyboardTypeOptions;
};

const FIELDS: FieldConfig[] = [
  { key: "prenom",         label: "Prénom",           renderIcon: (c) => <UserSvg color={c} /> },
  { key: "nom",            label: "Nom",              renderIcon: (c) => <UserSvg color={c} /> },
  { key: "date_naissance", label: "Date de naissance", renderIcon: (c) => <CakeSvg color={c} />, keyboard: "numeric" },
  { key: "telephone",      label: "Téléphone",        renderIcon: (c) => <PhoneSvg color={c} />, keyboard: "phone-pad" },
  { key: "email",          label: "E-mail",           renderIcon: (c) => <MailSvg color={c} />, keyboard: "email-address" },
  { key: "password",       label: "Mot de passe",     renderIcon: (c) => <LockSvg color={c} />, secure: true },
];

const METADATA_KEYS: FieldKey[] = ["prenom", "nom", "date_naissance", "telephone"];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const [values, setValues] = useState<Record<FieldKey, string>>({
    prenom: "", nom: "", date_naissance: "", telephone: "", email: "", password: "",
  });
  const valuesRef = useRef(values);
  const editingRef = useRef<FieldKey | null>(null);
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [saving, setSaving] = useState<FieldKey | null>(null);

  useEffect(() => {
    if (!user) return;
    api.getProfile().then((profile) => {
      const synced: Record<FieldKey, string> = {
        prenom:         profile?.prenom         || "",
        nom:            profile?.nom            || "",
        date_naissance: profile?.date_naissance || "",
        telephone:      profile?.telephone      || "",
        email:          user.email              ?? "",
        password:       "",
      };
      valuesRef.current = synced;
      setValues(synced);
    }).catch(() => {});
  }, [user?.id]);

  const handleChangeText = (key: FieldKey, text: string) => {
    const updated = { ...valuesRef.current, [key]: text };
    valuesRef.current = updated;
    setValues(updated);
  };

  const startEdit = (key: FieldKey) => {
    editingRef.current = key;
    setEditing(key);
    setTimeout(() => inputRefs.current[key]?.focus(), 50);
  };

  const saveField = async (key: FieldKey) => {
    if (editingRef.current !== key) return;
    editingRef.current = null;
    setEditing(null);
    const value = valuesRef.current[key].trim();
    setSaving(key);

    try {
      if (METADATA_KEYS.includes(key)) {
        await api.updateProfile({ [key]: value || null });
      } else if (key === "email") {
        if (!value) return;
        const { error } = await supabase.auth.updateUser({ email: value });
        if (error) throw error;
      } else if (key === "password") {
        if (value.length < 6) {
          setValues((v) => ({ ...v, password: "" }));
          if (value.length > 0) Alert.alert("Mot de passe trop court", "6 caractères minimum.");
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: value });
        if (error) throw error;
        setValues((v) => ({ ...v, password: "" }));
      }
    } catch (e: unknown) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPlum} />
          </TouchableOpacity>
          <Text style={styles.title}>Informations personnelles</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: insets.bottom + 94 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fieldsList}>
            {FIELDS.map((field, index) => {
              const isEditing = editing === field.key;
              const isSaving = saving === field.key;
              const isLast = index === FIELDS.length - 1;
              const rawVal = field.key === "password"
                ? (isEditing ? values.password : "")
                : values[field.key];

              return (
                <View key={field.key}>
                  <View style={styles.row}>
                    <View style={styles.rowIcon}>
                      {field.renderIcon(isSaving ? colors.primary : colors.muted)}
                    </View>

                    <View style={styles.rowContent}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      {isEditing ? (
                        <TextInput
                          ref={(r) => { inputRefs.current[field.key] = r; }}
                          style={styles.input}
                          value={values[field.key]}
                          onChangeText={(t) => handleChangeText(field.key, t)}
                          onBlur={() => saveField(field.key)}
                          secureTextEntry={field.secure}
                          keyboardType={field.keyboard ?? "default"}
                          autoCapitalize="none"
                          returnKeyType="done"
                          onSubmitEditing={() => saveField(field.key)}
                        />
                      ) : (
                        <Text
                          style={[styles.value, !rawVal && styles.valuePlaceholder]}
                          numberOfLines={1}
                        >
                          {field.key === "password"
                            ? "••••••••••"
                            : rawVal || "Non configuré"}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() => (isEditing ? saveField(field.key) : startEdit(field.key))}
                      hitSlop={12}
                    >
                      <Ionicons
                        name={isEditing ? "checkmark" : "create-outline"}
                        size={18}
                        color={isEditing ? colors.primary : colors.muted}
                      />
                    </TouchableOpacity>
                  </View>
                  {!isLast && <View style={styles.separator} />}
                </View>
              );
            })}
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPlum,
  },
  fieldsList: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 64,
  },
  rowIcon: {
    width: 22,
    marginRight: spacing.md,
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: "500",
  },
  valuePlaceholder: {
    color: colors.muted,
    fontWeight: "400",
    fontStyle: "italic",
  },
  input: {
    fontSize: 15,
    color: colors.textPlum,
    padding: 0,
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: colors.beige,
    marginLeft: spacing.lg + 22 + spacing.md,
  },
});
