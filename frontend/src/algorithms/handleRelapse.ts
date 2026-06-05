import type { AdjustmentResult, Motivation, RelapseDecision, RelapseInput } from '../types';

// Ordre croissant de douceur — utilisé pour descendre d'un cran de profil
const MOTIVATION_ORDER: Motivation[] = ['aggressive', 'moderate', 'gentle'];

// Semaines ajoutées quand le profil reste identique mais le planning est étiré
const DEFAULT_EXTENSION_WEEKS = 2;

// ─── Helpers purs ─────────────────────────────────────────────────────────────

/**
 * Descend le profil d'un cran sur l'échelle d'intensité.
 * Si déjà à 'gentle', reste à 'gentle' (plancher).
 */
function downgradeMotivation(current: Motivation): Motivation {
  const idx = MOTIVATION_ORDER.indexOf(current);
  return MOTIVATION_ORDER[Math.min(idx + 1, MOTIVATION_ORDER.length - 1)];
}

/**
 * Calcule la nouvelle baseline = moyenne arithmétique de l'usage réel
 * sur les 14 derniers jours. Arrondi à 2 décimales pour éviter le bruit
 * flottant dans les comparaisons aval.
 */
function computeNewBaseline(lastTwoWeeksUsage: number[]): number {
  const sum = lastTwoWeeksUsage.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / lastTwoWeeksUsage.length) * 100) / 100;
}

// ─── Logique de branchement ───────────────────────────────────────────────────

/**
 * Traduit la décision utilisateur en delta de profil + durée.
 * Retourne uniquement le delta ; l'appelant fusionne avec le reste du résultat.
 */
function applyDecision(
  decision: RelapseDecision,
  currentMotivation: Motivation,
): { newMotivation: Motivation; extensionWeeks: number; pauseWeeks: number } {
  switch (decision.difficulty) {

    // ── Manque de motivation ──────────────────────────────────────────────────
    // Proposition de baisse de profil ; si refusée, on étire la durée à la place.
    case 'lack_motivation':
      if (decision.profileDowngradeAccepted) {
        return { newMotivation: downgradeMotivation(currentMotivation), extensionWeeks: 0, pauseWeeks: 0 };
      }
      return { newMotivation: currentMotivation, extensionWeeks: DEFAULT_EXTENSION_WEEKS, pauseWeeks: 0 };

    // ── Trop difficile ────────────────────────────────────────────────────────
    // Cascade automatique aggressive → moderate → gentle, sans prompt utilisateur.
    case 'too_difficult':
      return { newMotivation: downgradeMotivation(currentMotivation), extensionWeeks: 0, pauseWeeks: 0 };

    // ── Quelque chose de difficile ────────────────────────────────────────────
    // L'utilisateur choisit entre une pause structurée et une simple extension.
    case 'something_difficult':
      if (decision.pauseDesired) {
        return { newMotivation: currentMotivation, extensionWeeks: 0, pauseWeeks: decision.pauseWeeks };
      }
      return { newMotivation: currentMotivation, extensionWeeks: DEFAULT_EXTENSION_WEEKS, pauseWeeks: 0 };

    // ── Période chargée / Je ne sais pas trop ─────────────────────────────────
    // Profil inchangé ; on rallonge uniquement la durée pour absorber le retard.
    case 'busy_period':
    case 'dont_know':
      return { newMotivation: currentMotivation, extensionWeeks: DEFAULT_EXTENSION_WEEKS, pauseWeeks: 0 };
  }
}

// ─── Point d'entrée public ────────────────────────────────────────────────────

/**
 * Algo 2 — Ajustement en cas de dépassement.
 *
 * Déclenché par :
 *   - 'silent_flag'         : usage > baseline sur une semaine isolée
 *                             → reset silencieux, aucune mention de régression
 *   - 'consecutive_misses'  : 2 semaines ratées consécutives
 *                             → dialogue complet avec l'utilisateur
 *
 * Dans les deux cas, on pose la question de difficulté, on applique la branche
 * correspondante, puis on recalcule baseline + profil avant de repasser dans
 * generateProgram (Algo 1) avec les nouvelles valeurs.
 *
 * @returns AdjustmentResult — à transmettre directement à generateProgram :
 *   currentScreenTime = newBaseline
 *   motivation        = newMotivation
 */
export function handleRelapse(input: RelapseInput): AdjustmentResult {
  const { trigger, lastTwoWeeksUsage, currentMotivation, decision } = input;

  // Nouvelle baseline = moyenne de l'usage réel sur les 14 derniers jours
  const newBaseline = computeNewBaseline(lastTwoWeeksUsage);

  const { newMotivation, extensionWeeks, pauseWeeks } = applyDecision(decision, currentMotivation);

  return {
    newBaseline,
    newMotivation,
    extensionWeeks,
    pauseWeeks,
    consecutiveMisses: 0,
    // Déclenchement silencieux : l'UI ne doit pas afficher de message de régression
    silentReset: trigger === 'silent_flag',
    message: 'Programme ajusté, on repart de là',
  };
}