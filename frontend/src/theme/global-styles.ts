import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from './colors';

// Typographie — équivalent des classes h1, h2, subtitle, body, etc.
export const typography = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPlum,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPlum,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPlum,
  },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPlum,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  error: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C0504D',
    textAlign: 'center',
  },
});

// Layout — container, card, row, center, etc.
export const layout = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 2,
  },
  cardYellow: {
    backgroundColor: colors.yellow,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});

// Boutons — primary, outline, ghost
export const buttons = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  outlineText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  ghost: {
    backgroundColor: colors.offWhite,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  ghostText: {
    color: colors.textDark,
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
