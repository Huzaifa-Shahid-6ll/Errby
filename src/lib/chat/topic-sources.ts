// Public, finite reference snapshots checked against these source pages on 2026-10-01.
// ponytail: two curated topics only; add independently verified sources when expanding the catalog.
export const topicSources = [
  {
    id: "heat-transfer",
    title: "How heat moves",
    publisher: "NOAA JetStream",
    sourceTitle: "The Transfer of Heat Energy",
    url: "https://www.noaa.gov/jetstream/atmosphere/transfer-of-heat-energy",
    section: "Radiation, Conduction and Convection",
    checkedAt: "2026-10-01",
    sourceNote: "An introductory weather-science reference.",
    quote: "Convection is the transfer of heat energy in a fluid.",
    notes:
      "Thermal energy can move in three ways. Radiation carries energy as electromagnetic waves; warmth from a fire can reach a person without air carrying it. Conduction passes energy between neighboring particles. A metal spoon's handle warms when its other end sits in hot soup. Metals conduct heat effectively, while air is a poor conductor. Convection carries energy with moving liquid or gas, such as circulating water in a heated pot or rising warm air. These notes cover the three transfer methods and examples, not calculations or every change of state.",
  },
  {
    id: "equivalent-fractions",
    title: "Equivalent fractions",
    publisher: "NASA Goddard · Dr. David P. Stern",
    sourceTitle: "Deriving Approximate Results",
    url: "https://pwg.gsfc.nasa.gov/stargaze/Salgeb5.htm",
    section: "A Preliminary Derivation",
    checkedAt: "2026-10-01",
    sourceNote:
      "Archived NASA reference, last edited in 2016. This starter uses only the fraction-equivalence rule.",
    quote: "multiplying anything by 1 does not change its value.",
    notes:
      "The numerator is the top of a fraction and the denominator is its bottom. Multiplying both by one identical nonzero factor gives an equivalent fraction. This preserves the value because the factor divided by itself equals one. For example, multiplying both parts of 2/3 by 4 gives 8/12. Dividing both parts by the same nonzero factor also preserves value: 8/12 becomes 2/3 when both are divided by 4. A denominator cannot be zero. These notes cover equivalent fractions, not the later approximation methods on the source page.",
  },
] as const;

export type TopicNotes = { text: string; title: string; url: string };

export function topicNotes(source: (typeof topicSources)[number]): TopicNotes {
  return {
    title: source.title,
    url: source.url,
    text: `${source.title}\n\nReference notes (Errby summary):\n${source.notes}\n\nSource excerpt: “${source.quote}”\nSource: ${source.publisher}, ${source.sourceTitle} — ${source.section}\n${source.url}\nSource checked: ${source.checkedAt}. ${source.sourceNote}`,
  };
}
