import type { CityCandidate, NoveltyLevel } from "./city-candidates.js";

interface PreferenceInput {
  hangoutTypes: string[];
  duration: string;
  budget: string;
  groupSize?: string;
  mood?: string[];
}

interface LocationInput {
  location: string;
  distance: string;
  transportation: string[];
}

interface ScorablePlace {
  title: string;
  type?: string;
  price?: string;
  rating?: string;
  tags?: string[];
  moodTags?: string[];
  matchReasons?: string[];
  noveltyLevel?: NoveltyLevel;
  trendScore?: number;
  groupFit?: string[];
  indoorOutdoor?: string;
}

export interface ScoreResult {
  score: number;
  matchReasons: string[];
}

const hangoutTypeMap: Record<string, string[]> = {
  exploring: ["exploring", "walk", "market", "nature", "photos", "shopping"],
  eating: ["eating", "food", "foodie", "restaurant", "street-food", "tibetan-food"],
  historical: ["historical", "heritage", "culture", "architecture", "art"],
  "cafe hopping": ["cafe", "coffee", "bakery", "bookstores"],
};

export function scoreCandidate(
  candidate: CityCandidate,
  preferences: PreferenceInput,
  locationData: LocationInput
): ScoreResult {
  return scorePlace(
    {
      ...candidate,
      price: priceForBudgetTier(candidate.budgetTier),
    },
    preferences,
    locationData
  );
}

export function scorePlace(
  place: ScorablePlace,
  preferences: PreferenceInput,
  locationData: LocationInput
): ScoreResult {
  let score = 40;
  const reasons: string[] = [];
  const tags = new Set((place.tags || []).map((tag) => tag.toLowerCase()));
  const moodTags = new Set((place.moodTags || []).map((tag) => tag.toLowerCase()));
  const type = String(place.type || "").toLowerCase();

  if (matchesHangoutType(type, tags, preferences.hangoutTypes)) {
    score += 18;
    reasons.push("Matches activity style");
  }

  if (matchesMood(moodTags, tags, preferences.mood || [])) {
    score += 16;
    reasons.push(`Fits ${(preferences.mood || ["selected"]).slice(0, 2).join(" + ")} mood`);
  }

  if (matchesBudget(place.price, preferences.budget)) {
    score += 10;
    reasons.push("Budget fit");
  }

  if (place.groupFit?.includes(preferences.groupSize || "Solo")) {
    score += 10;
    reasons.push(`Good for ${preferences.groupSize || "Solo"}`);
  }

  if (place.noveltyLevel === "hidden-gem" || place.noveltyLevel === "niche") {
    score += 12;
    reasons.push(place.noveltyLevel === "niche" ? "Niche local pick" : "Hidden gem");
  } else if (place.noveltyLevel === "popular-local") {
    score += 8;
    reasons.push("Popular with locals");
  }

  if ((place.trendScore || 0) >= 80) {
    score += 8;
    reasons.push("Trending nearby");
  }

  if (locationData.distance.toLowerCase().includes("walking") && tags.has("walkable")) {
    score += 8;
    reasons.push("Walkable fit");
  }

  if (locationData.transportation.includes("Driving") && tags.has("easy-parking")) {
    score += 4;
    reasons.push("Easy with driving");
  }

  if (!place.title || /^stop\s+\d+/i.test(place.title)) {
    score -= 12;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    matchReasons: uniqueReasons([...(place.matchReasons || []), ...reasons]).slice(0, 4),
  };
}

export function rankCandidates(
  candidates: CityCandidate[],
  preferences: PreferenceInput,
  locationData: LocationInput,
  limit = 18
): Array<CityCandidate & ScoreResult> {
  return candidates
    .map((candidate) => ({
      ...candidate,
      ...scoreCandidate(candidate, preferences, locationData),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildCandidateMatchReasons(candidate: CityCandidate): string[] {
  return uniqueReasons([
    candidate.noveltyLevel === "niche" ? "Niche local pick" : undefined,
    candidate.noveltyLevel === "hidden-gem" ? "Hidden gem" : undefined,
    candidate.trendScore >= 80 ? "Trending nearby" : undefined,
    candidate.indoorOutdoor === "indoor" ? "Indoor option" : undefined,
    candidate.tags.includes("walkable") ? "Walkable fit" : undefined,
  ]).slice(0, 3);
}

function matchesHangoutType(type: string, tags: Set<string>, selected: string[]): boolean {
  return selected.some((rawType) => {
    const normalized = rawType.toLowerCase();
    const accepted = hangoutTypeMap[normalized] || [normalized];
    return accepted.some((value) => type.includes(value) || tags.has(value));
  });
}

function matchesMood(moodTags: Set<string>, tags: Set<string>, selected: string[]): boolean {
  return selected.some((mood) => {
    const normalized = mood.toLowerCase();
    return moodTags.has(normalized) || tags.has(normalized);
  });
}

function matchesBudget(price: string | undefined, budget: string): boolean {
  const normalizedBudget = budget.toLowerCase();
  const normalizedPrice = String(price || "").toLowerCase();

  if (normalizedBudget.includes("budget")) {
    return normalizedPrice.includes("free") || normalizedPrice === "₹";
  }

  if (normalizedBudget.includes("luxury")) {
    return normalizedPrice.includes("₹₹") || normalizedPrice.includes("₹₹₹");
  }

  return normalizedPrice.includes("₹") || normalizedPrice.includes("free");
}

function priceForBudgetTier(tier: CityCandidate["budgetTier"]): string {
  if (tier === "free") return "Free";
  if (tier === "budget") return "₹";
  if (tier === "luxury") return "₹₹₹";
  return "₹₹";
}

function uniqueReasons(reasons: Array<string | undefined>): string[] {
  return Array.from(new Set(reasons.filter(Boolean) as string[]));
}

