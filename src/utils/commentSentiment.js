const POSITIVE_WORDS = new Set([
  "amazing",
  "awesome",
  "beautiful",
  "best",
  "brilliant",
  "cool",
  "enjoyed",
  "epic",
  "excellent",
  "fantastic",
  "fun",
  "good",
  "great",
  "helpful",
  "impressive",
  "incredible",
  "insightful",
  "interesting",
  "love",
  "loved",
  "lovely",
  "nice",
  "perfect",
  "smart",
  "strong",
  "super",
  "useful",
  "valuable",
  "well",
  "wonderful",
  "wow",
]);

const NEGATIVE_WORDS = new Set([
  "annoying",
  "awful",
  "bad",
  "boring",
  "broken",
  "confusing",
  "disappointing",
  "dislike",
  "hate",
  "hated",
  "hard",
  "horrible",
  "issue",
  "issues",
  "messy",
  "poor",
  "rough",
  "slow",
  "terrible",
  "ugly",
  "unclear",
  "underwhelming",
  "unhelpful",
  "weak",
  "worse",
  "worst",
  "wrong",
]);

const NEGATIONS = new Set([
  "aint",
  "aren't",
  "cant",
  "can't",
  "didnt",
  "didn't",
  "doesnt",
  "doesn't",
  "dont",
  "don't",
  "isnt",
  "isn't",
  "never",
  "no",
  "none",
  "not",
  "wasnt",
  "wasn't",
  "without",
]);

const INTENSIFIERS = new Set([
  "extremely",
  "highly",
  "really",
  "so",
  "super",
  "too",
  "very",
]);

const normalizeText = (value = "") => value.replace(/\s+/g, " ").trim();

const tokenize = (text = "") =>
  normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const uniqueTerms = (terms) => [...new Set(terms)];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resolveSentimentLabel = (score) => {
  if (score >= 0.2) {
    return "positive";
  }

  if (score <= -0.2) {
    return "negative";
  }

  return "neutral";
};

const pickTopTerms = (terms) =>
  [...terms.entries()]
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
    )
    .slice(0, 4)
    .map(([term]) => term);

export const analyzeCommentSentiment = (content = "") => {
  const tokens = tokenize(content);
  let score = 0;
  const positiveTerms = [];
  const negativeTerms = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const previousToken = tokens[index - 1];
    const secondPreviousToken = tokens[index - 2];
    const isNegated =
      NEGATIONS.has(previousToken) || NEGATIONS.has(secondPreviousToken);
    const intensityBoost = INTENSIFIERS.has(previousToken) ? 0.4 : 0;
    const weight = 1 + intensityBoost;

    if (POSITIVE_WORDS.has(token)) {
      if (isNegated) {
        score -= weight;
        negativeTerms.push(token);
      } else {
        score += weight;
        positiveTerms.push(token);
      }
    }

    if (NEGATIVE_WORDS.has(token)) {
      if (isNegated) {
        score += weight;
        positiveTerms.push(token);
      } else {
        score -= weight;
        negativeTerms.push(token);
      }
    }
  }

  const matchedTermsCount = positiveTerms.length + negativeTerms.length;
  const punctuationBoost = Math.min(
    (content.match(/!/g) || []).length * 0.05,
    0.2
  );
  const normalizedScore = matchedTermsCount
    ? clamp(score / matchedTermsCount, -1, 1)
    : 0;
  const confidence = matchedTermsCount
    ? clamp(
        0.3 +
          Math.abs(normalizedScore) * 0.45 +
          matchedTermsCount * 0.08 +
          punctuationBoost,
        0,
        1
      )
    : 0.15;

  return {
    label: resolveSentimentLabel(normalizedScore),
    score: Number(normalizedScore.toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
    positiveTerms: uniqueTerms(positiveTerms),
    negativeTerms: uniqueTerms(negativeTerms),
    analyzedAt: new Date(),
  };
};

const serializeHighlight = (comment) => {
  if (!comment) {
    return null;
  }

  return {
    _id: comment._id,
    content: comment.content,
    createdAt: comment.createdAt,
    owner: comment.owner
      ? {
          _id: comment.owner._id,
          fullname: comment.owner.fullname,
          username: comment.owner.username,
          avatar: comment.owner.avatar,
        }
      : null,
    sentiment: comment.sentiment,
  };
};

export const buildCommentSentimentOverview = (comments = []) => {
  const overview = {
    totalComments: comments.length,
    breakdown: {
      positive: 0,
      neutral: 0,
      negative: 0,
    },
    averageScore: 0,
    dominantSentiment: "neutral",
    trendingTerms: {
      positive: [],
      negative: [],
    },
    highlights: {
      mostPositive: null,
      mostNegative: null,
    },
  };

  if (comments.length === 0) {
    return overview;
  }

  const positiveTermMap = new Map();
  const negativeTermMap = new Map();
  let totalScore = 0;
  let mostPositiveComment = null;
  let mostNegativeComment = null;

  for (const comment of comments) {
    const sentiment =
      comment.sentiment || analyzeCommentSentiment(comment.content);
    totalScore += sentiment.score;
    overview.breakdown[sentiment.label] += 1;

    for (const term of sentiment.positiveTerms || []) {
      positiveTermMap.set(term, (positiveTermMap.get(term) || 0) + 1);
    }

    for (const term of sentiment.negativeTerms || []) {
      negativeTermMap.set(term, (negativeTermMap.get(term) || 0) + 1);
    }

    if (
      !mostPositiveComment ||
      sentiment.score > mostPositiveComment.sentiment.score
    ) {
      mostPositiveComment = {
        ...comment,
        sentiment,
      };
    }

    if (
      !mostNegativeComment ||
      sentiment.score < mostNegativeComment.sentiment.score
    ) {
      mostNegativeComment = {
        ...comment,
        sentiment,
      };
    }
  }

  overview.averageScore = Number((totalScore / comments.length).toFixed(2));

  overview.dominantSentiment = Object.entries(overview.breakdown).sort(
    ([leftLabel, leftValue], [rightLabel, rightValue]) =>
      rightValue - leftValue || leftLabel.localeCompare(rightLabel)
  )[0][0];

  overview.trendingTerms = {
    positive: pickTopTerms(positiveTermMap),
    negative: pickTopTerms(negativeTermMap),
  };

  overview.highlights = {
    mostPositive:
      mostPositiveComment?.sentiment?.score > 0
        ? serializeHighlight(mostPositiveComment)
        : null,
    mostNegative:
      mostNegativeComment?.sentiment?.score < 0
        ? serializeHighlight(mostNegativeComment)
        : null,
  };

  return overview;
};
