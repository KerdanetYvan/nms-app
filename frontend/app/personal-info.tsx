import { useRef, useState } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "@/src/hooks/use-auth";
import { supabase } from "@/src/lib/supabase";
import { BottomNav, NavTab } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";

type FieldKey = "prenom" | "nom" | "date_naissance" | "telephone" | "email" | "password";

type FieldConfig = {
  key: FieldKey;
  icon: string;
  secure?: boolean;
  keyboard?: KeyboardTypeOptions;
};

const FIELDS: FieldConfig[] = [
  { key: "prenom", icon: "account-outline" },
  { key: "nom", icon: "account-outline" },
  { key: "date_naissance", icon: "cake-variant-outline", keyboard: "numeric" },
  { key: "telephone", icon: "phone-outline", keyboard: "phone-pad" },
  { key: "email", icon: "email-outline", keyboard: "email-address" },
  { key: "password", icon: "key-outline", secure: true },
];

const METADATA_KEYS: FieldKey[] = ["prenom", "nom", "date_naissance", "telephone"];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const [values, setValues] = useState<Record<FieldKey, string>>({
    prenom: user?.user_metadata?.prenom ?? "",
    nom: user?.user_metadata?.nom ?? "",
    date_naissance: user?.user_metadata?.date_naissance ?? "",
    telephone: user?.user_metadata?.telephone ?? "",
    email: user?.email ?? "",
    password: "",
  });
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [saving, setSaving] = useState<FieldKey | null>(null);

  const startEdit = (key: FieldKey) => {
    setEditing(key);
    setTimeout(() => inputRefs.current[key]?.focus(), 50);
  };

  const saveField = async (key: FieldKey) => {
    setEditing(null);
    const value = values[key].trim();
    setSaving(key);

    try {
      if (METADATA_KEYS.includes(key)) {
        const { error } = await supabase.auth.updateUser({ data: { [key]: value } });
        if (error) throw error;
      } else if (key === "email") {
        if (!value) return;
        const { error } = await supabase.auth.updateUser({ email: value });
        if (error) throw error;
      } else if (key === "password") {
        if (value.length < 6) {
          setValues((v) => ({ ...v, password: "" }));
          if (value.length > 0)
            Alert.alert("Mot de passe trop court", "6 caractères minimum.");
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: value });
        if (error) throw error;
        setValues((v) => ({ ...v, password: "" }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Une erreur est survenue.";
      Alert.alert("Erreur", msg);
    } finally {
      setSaving(null);
    }
  };

  const displayValue = (key: FieldKey): string => {
    if (key === "password") return editing === "password" ? values.password : "••••••••••";
    return values[key];
  };

  const handleTabPress = (tab: NavTab) => {
    if (tab === "home") router.replace("/");
    if (tab === "user") router.replace("/profile");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPlum} />
          </TouchableOpacity>
          <Text style={styles.title}>Informations personnelles</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 94 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.fieldsList}>
            {FIELDS.map((field, index) => {
              const isEditing = editing === field.key;
              const isSaving = saving === field.key;
              const val = displayValue(field.key);
              const isLast = index === FIELDS.length - 1;

              return (
                <View key={field.key}>
                  <View style={styles.row}>
                    <MaterialCommunityIcons
                      name={field.icon as never}
                      size={20}
                      color={isSaving ? colors.primary : colors.muted}
                      style={styles.rowIcon}
                    />

                    {isEditing ? (
                      <TextInput
                        ref={(r) => { inputRefs.current[field.key] = r; }}
                        style={styles.input}
                        value={values[field.key]}
                        onChangeText={(t) => setValues((v) => ({ ...v, [field.key]: t }))}
                        onBlur={() => saveField(field.key)}
                        secureTextEntry={field.secure}
                        keyboardType={field.keyboard ?? "default"}
                        autoCapitalize="none"
                        returnKeyType="done"
                        onSubmitEditing={() => saveField(field.key)}
                      />
                    ) : (
                      <Text
                        style={[styles.value, !val && styles.valuePlaceholder]}
                        numberOfLines={1}
                      >
                        {val || " "}
                      </Text>
                    )}

                    <TouchableOpacity
                      onPress={() => (isEditing ? saveField(field.key) : startEdit(field.key))}
                      hitSlop={12}
                    >
                      <MaterialCommunityIcons
                        name={isEditing ? "check" : "pencil-outline"}
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

        <BottomNav active="user" onPress={handleTabPress} />
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
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    minHeight: 58,
  },
  rowIcon: {
    marginRight: spacing.md,
    width: 22,
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
  },
  valuePlaceholder: {
    color: "transparent",
  },
  input: {
    flex: 1,
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
