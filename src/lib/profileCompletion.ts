// Single source of truth for "profile completion %" — previously
// duplicated independently in the dashboard page (9 fields) and the
// profile page (10 fields, including can_help_with), which meant the
// same member could see two different completion percentages
// depending on which page they were on. Both now import this.
export const TRACKED_PROFILE_FIELDS = [
  "bio",
  "profession",
  "company",
  "city",
  "category",
  "country",
  "looking_for",
  "can_help_with",
  "linkedin",
  "website",
];

export function profileCompletionPct(profile: any): number {
  if (!profile) return 0;
  const filled = TRACKED_PROFILE_FIELDS.filter(
    (f) => (profile?.[f] || "").toString().trim().length > 0,
  ).length;
  return Math.round((filled / TRACKED_PROFILE_FIELDS.length) * 100);
}
