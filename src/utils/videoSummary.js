const STOP_WORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "doing",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "just",
  "me",
  "more",
  "most",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "now",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "she",
  "should",
  "so",
  "some",
  "such",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "with",
  "would",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
]);

const MAX_SHORT_SUMMARY_LENGTH = 180;

const normalizeText = (value = "") => value.replace(/\s+/g, " ").trim();

const splitIntoSentences = (text = "") =>
  normalizeText(text)
    .match(/[^.!?]+[.!?]?/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [];

const tokenize = (text = "") =>
  normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const buildWordFrequencyMap = (tokens) => {
  const frequencyMap = new Map();

  for (const token of tokens) {
    frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
  }

  return frequencyMap;
};

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
};

const uniqueTerms = (terms) => [...new Set(terms)];

export const generateVideoSummary = ({
  title = "",
  description = "",
  transcript = "",
}) => {
  const normalizedTitle = normalizeText(title);
  const normalizedDescription = normalizeText(description);
  const normalizedTranscript = normalizeText(transcript);

  const sourceType = normalizedTranscript
    ? "transcript"
    : normalizedDescription
      ? "description"
      : normalizedTitle
        ? "title"
        : "empty";

  const primarySource =
    normalizedTranscript || normalizedDescription || normalizedTitle;
  const sentences = splitIntoSentences(
    normalizedTranscript ||
      [normalizedTitle, normalizedDescription].filter(Boolean).join(". ")
  );
  const allTokens = tokenize(
    [normalizedTitle, normalizedDescription, normalizedTranscript]
      .filter(Boolean)
      .join(" ")
  );
  const titleTerms = new Set(tokenize(normalizedTitle));
  const frequencyMap = buildWordFrequencyMap(allTokens);

  if (!primarySource) {
    return {
      short: "",
      detailed: "",
      keyTakeaways: [],
      keywords: [],
      sourceType,
      generatedAt: new Date(),
    };
  }

  const rankedSentences = sentences.map((sentence, index) => {
    const sentenceTokens = tokenize(sentence);

    const score = sentenceTokens.reduce((total, token) => {
      const frequencyBoost = frequencyMap.get(token) || 0;
      const titleBoost = titleTerms.has(token) ? 1.5 : 0;
      return total + frequencyBoost + titleBoost;
    }, 0);

    return {
      index,
      sentence,
      score,
    };
  });

  const selectedSentenceCount =
    sentences.length >= 8 ? 4 : sentences.length >= 4 ? 3 : 2;
  const bestSentences = rankedSentences
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, selectedSentenceCount)
    .sort((left, right) => left.index - right.index)
    .map((item) => item.sentence);

  const detailedSummary = normalizeText(
    (bestSentences.length > 0 ? bestSentences : sentences.slice(0, 2)).join(" ")
  );

  const shortSummarySource =
    bestSentences[0] ||
    sentences[0] ||
    normalizedDescription ||
    normalizedTitle;
  const keywords = uniqueTerms(
    [...frequencyMap.entries()]
      .sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
      )
      .slice(0, 6)
      .map(([term]) => term)
  );

  return {
    short: truncateText(shortSummarySource, MAX_SHORT_SUMMARY_LENGTH),
    detailed: detailedSummary || truncateText(primarySource, 260),
    keyTakeaways: bestSentences.slice(0, 4).map((sentence) => sentence.trim()),
    keywords,
    sourceType,
    generatedAt: new Date(),
  };
};
