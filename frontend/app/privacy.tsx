import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { BottomNav } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";

type Section = { title: string; body: string };

const SECTIONS: Section[] = [
  {
    title: "1. Responsable du traitement",
    body: "Le responsable du traitement des données personnelles collectées via l'application Doo est Yvan Kerdanet. Contact : kerdanety@gmail.com",
  },
  {
    title: "2. Données collectées",
    body: "Lors de votre inscription et utilisation de l'application, nous collectons :\n• Adresse e-mail (obligatoire)\n• Prénom et nom\n• Date de naissance\n• Numéro de téléphone (facultatif)\n• Données de progression dans l'application (défis, réponses, jours d'utilisation)",
  },
  {
    title: "3. Finalités du traitement",
    body: "Vos données sont utilisées pour :\n• Créer et gérer votre compte\n• Vous permettre de suivre votre programme de réduction du temps d'écran\n• Vous envoyer des notifications de rappel (si vous les avez activées)",
  },
  {
    title: "4. Base légale",
    body: "Le traitement de vos données repose sur votre consentement (article 6.1.a du RGPD), donné lors de la création de votre compte. Vous pouvez retirer ce consentement à tout moment en supprimant votre compte.",
  },
  {
    title: "5. Hébergement et sécurité",
    body: "Vos données sont hébergées par Supabase (infrastructure AWS, région EU). Les données sont chiffrées en transit (TLS) et au repos. Aucun mot de passe n'est stocké en clair.",
  },
  {
    title: "6. Partage des données",
    body: "Nous ne vendons pas vos données personnelles. Elles ne sont partagées qu'avec Supabase, notre prestataire d'hébergement, dans le cadre strict de la fourniture du service.",
  },
  {
    title: "7. Durée de conservation",
    body: "Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, l'ensemble de vos données personnelles est effacé dans un délai de 30 jours.",
  },
  {
    title: "8. Vos droits (RGPD)",
    body: "Conformément au RGPD, vous disposez des droits suivants :\n• Accès à vos données\n• Rectification\n• Effacement (« droit à l'oubli »)\n• Portabilité\n• Opposition au traitement\n\nPour exercer ces droits, contactez-nous à : kerdanety@gmail.com",
  },
  {
    title: "9. Notifications",
    body: "Si vous activez les notifications, un identifiant de périphérique est transmis à notre service pour l'envoi de rappels. Vous pouvez désactiver les notifications à tout moment depuis les paramètres de l'application ou ceux de votre téléphone.",
  },
  {
    title: "10. Modifications",
    body: "Cette politique peut être mise à jour. Toute modification substantielle vous sera communiquée par e-mail ou notification dans l'application.",
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPlum} />
        </TouchableOpacity>
        <Text style={styles.title}>Confidentialité</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 94 + spacing.lg }]}
      >
        <Text style={styles.lastUpdated}>Dernière mise à jour : juin 2025</Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>

      <BottomNav />
    </View>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPlum,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPlum,
  },
  sectionBody: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 22,
  },
});
