import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { BottomNav } from "@/src/components/bottom-nav";
import { colors, radius, spacing } from "@/src/theme/colors";

type Section = { title: string; body: string };

const SECTIONS: Section[] = [
  {
    title: "1. Objet",
    body: "Les présentes conditions d'utilisation régissent l'accès et l'usage de l'application Doo, un outil d'aide à la réduction du temps d'écran. En utilisant Doo, vous acceptez ces conditions dans leur intégralité.",
  },
  {
    title: "2. Accès au service",
    body: "L'application est accessible à toute personne disposant d'un appareil compatible et d'une connexion internet. La création d'un compte est nécessaire pour accéder à l'ensemble des fonctionnalités. Vous êtes responsable de la confidentialité de vos identifiants.",
  },
  {
    title: "3. Utilisation autorisée",
    body: "Doo est destiné à un usage personnel et non commercial. Vous vous engagez à ne pas tenter de contourner les mécanismes de l'application, à ne pas accéder à des données qui ne vous appartiennent pas, et à ne pas utiliser l'application à des fins illicites.",
  },
  {
    title: "4. Contenu et données",
    body: "Les données saisies dans l'application (informations personnelles, réponses aux défis) restent votre propriété. Vous nous accordez le droit de les stocker et de les utiliser pour faire fonctionner le service. Nous ne les revendons pas à des tiers.",
  },
  {
    title: "5. Disponibilité",
    body: "Nous nous efforçons de maintenir le service disponible en permanence, mais nous ne pouvons garantir une disponibilité sans interruption. Des maintenances ponctuelles peuvent entraîner des coupures temporaires.",
  },
  {
    title: "6. Résiliation",
    body: "Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l'application. Nous nous réservons le droit de suspendre ou supprimer tout compte en cas de violation des présentes conditions.",
  },
  {
    title: "7. Limitation de responsabilité",
    body: "Doo est un outil d'accompagnement. Il ne constitue pas un traitement médical ou psychologique. Nous ne saurions être tenus responsables des conséquences de son utilisation ou de sa non-utilisation.",
  },
  {
    title: "8. Modifications",
    body: "Ces conditions peuvent être mises à jour. En cas de modification substantielle, vous en serez informé par notification ou par e-mail. La poursuite de l'utilisation de l'application vaut acceptation des nouvelles conditions.",
  },
  {
    title: "9. Contact",
    body: "Pour toute question relative aux présentes conditions, contactez-nous à l'adresse : kerdanety@gmail.com",
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPlum} />
        </TouchableOpacity>
        <Text style={styles.title}>Conditions d'utilisation</Text>
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
