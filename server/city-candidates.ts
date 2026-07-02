export type NoveltyLevel = "iconic" | "popular-local" | "hidden-gem" | "niche";
export type IndoorOutdoor = "indoor" | "outdoor" | "mixed";

export interface CityCandidate {
  id: string;
  city: string;
  title: string;
  neighborhood: string;
  address: string;
  type: "exploring" | "eating" | "historical" | "cafe";
  tags: string[];
  moodTags: string[];
  budgetTier: "free" | "budget" | "mid-range" | "luxury";
  groupFit: string[];
  noveltyLevel: NoveltyLevel;
  indoorOutdoor: IndoorOutdoor;
  estimatedDuration: string;
  rating: string;
  trendScore: number;
  trendReason: string;
  imageCategory: string;
}

const candidates: CityCandidate[] = [
  {
    id: "delhi-sunder-nursery",
    city: "Delhi",
    title: "Sunder Nursery Garden Walk",
    neighborhood: "Nizamuddin",
    address: "Sunder Nursery, Nizamuddin, New Delhi",
    type: "exploring",
    tags: ["garden", "heritage", "walkable", "calm"],
    moodTags: ["Relaxed", "Peaceful", "Cultural", "Romantic"],
    budgetTier: "budget",
    groupFit: ["Solo", "Couple", "Small Group"],
    noveltyLevel: "popular-local",
    indoorOutdoor: "outdoor",
    estimatedDuration: "1.5 hours",
    rating: "4.7 ★",
    trendScore: 83,
    trendReason: "Popular for golden-hour walks and quieter heritage photos.",
    imageCategory: "historical landmarks",
  },
  {
    id: "delhi-champagali",
    city: "Delhi",
    title: "Champa Gali Cafe Lane",
    neighborhood: "Saket",
    address: "Champa Gali, Saidulajab, Saket, New Delhi",
    type: "cafe",
    tags: ["cafe", "indie", "date-friendly", "photos"],
    moodTags: ["Romantic", "Social", "Foodie", "Relaxed"],
    budgetTier: "mid-range",
    groupFit: ["Couple", "Small Group"],
    noveltyLevel: "hidden-gem",
    indoorOutdoor: "mixed",
    estimatedDuration: "1.5 hours",
    rating: "4.5 ★",
    trendScore: 86,
    trendReason: "Strong local cafe cluster with independent spots.",
    imageCategory: "cafe atmosphere",
  },
  {
    id: "delhi-majnu-ka-tilla",
    city: "Delhi",
    title: "Majnu Ka Tilla Food Lanes",
    neighborhood: "North Delhi",
    address: "Majnu Ka Tilla, New Aruna Nagar, Delhi",
    type: "eating",
    tags: ["tibetan-food", "market", "local", "budget"],
    moodTags: ["Foodie", "Social", "Exploring", "Energetic"],
    budgetTier: "budget",
    groupFit: ["Solo", "Couple", "Small Group"],
    noveltyLevel: "popular-local",
    indoorOutdoor: "mixed",
    estimatedDuration: "2 hours",
    rating: "4.6 ★",
    trendScore: 88,
    trendReason: "Reliable local food trail beyond the usual tourist circuit.",
    imageCategory: "restaurant dining",
  },
  {
    id: "delhi-triveni",
    city: "Delhi",
    title: "Triveni Terrace Cafe And Art Stop",
    neighborhood: "Mandi House",
    address: "Triveni Kala Sangam, 205 Tansen Marg, New Delhi",
    type: "cafe",
    tags: ["art", "cafe", "quiet", "culture"],
    moodTags: ["Peaceful", "Cultural", "Solo", "Relaxed"],
    budgetTier: "budget",
    groupFit: ["Solo", "Couple", "Small Group"],
    noveltyLevel: "niche",
    indoorOutdoor: "mixed",
    estimatedDuration: "1.5 hours",
    rating: "4.5 ★",
    trendScore: 78,
    trendReason: "Quiet creative stop that locals recommend for an unhurried break.",
    imageCategory: "cafe atmosphere",
  },
  {
    id: "noida-dlf-mall",
    city: "Noida",
    title: "DLF Mall Of India Activity Loop",
    neighborhood: "Sector 18",
    address: "DLF Mall of India, Sector 18, Noida",
    type: "exploring",
    tags: ["indoor", "shopping", "games", "group-friendly"],
    moodTags: ["Social", "Energetic", "Relaxed"],
    budgetTier: "mid-range",
    groupFit: ["Couple", "Small Group", "Large Group"],
    noveltyLevel: "iconic",
    indoorOutdoor: "indoor",
    estimatedDuration: "2 hours",
    rating: "4.6 ★",
    trendScore: 82,
    trendReason: "Dependable indoor anchor for groups and bad weather.",
    imageCategory: "city exploration",
  },
  {
    id: "noida-sector-104-cafes",
    city: "Noida",
    title: "Sector 104 Cafe Cluster",
    neighborhood: "Sector 104",
    address: "Sector 104 market, Noida",
    type: "cafe",
    tags: ["cafe", "date-friendly", "foodie", "easy-parking"],
    moodTags: ["Romantic", "Foodie", "Social", "Relaxed"],
    budgetTier: "mid-range",
    groupFit: ["Couple", "Small Group"],
    noveltyLevel: "popular-local",
    indoorOutdoor: "mixed",
    estimatedDuration: "1.5 hours",
    rating: "4.4 ★",
    trendScore: 84,
    trendReason: "Strong cafe discovery area for Noida locals.",
    imageCategory: "cafe atmosphere",
  },
  {
    id: "noida-okhla-bird-sanctuary",
    city: "Noida",
    title: "Okhla Bird Sanctuary Walk",
    neighborhood: "Sector 95",
    address: "Okhla Bird Sanctuary, Sector 95, Noida",
    type: "exploring",
    tags: ["nature", "walkable", "quiet", "morning"],
    moodTags: ["Peaceful", "Relaxed", "Solo", "Adventurous"],
    budgetTier: "budget",
    groupFit: ["Solo", "Couple", "Small Group"],
    noveltyLevel: "hidden-gem",
    indoorOutdoor: "outdoor",
    estimatedDuration: "1.5 hours",
    rating: "4.4 ★",
    trendScore: 76,
    trendReason: "A calmer nature stop inside a dense urban area.",
    imageCategory: "city exploration",
  },
  {
    id: "jaipur-panna-meena",
    city: "Jaipur",
    title: "Panna Meena Ka Kund Photo Stop",
    neighborhood: "Amer",
    address: "Panna Meena Ka Kund, Amer, Jaipur",
    type: "historical",
    tags: ["stepwell", "heritage", "photos", "architecture"],
    moodTags: ["Cultural", "Romantic", "Exploring", "Peaceful"],
    budgetTier: "free",
    groupFit: ["Solo", "Couple", "Small Group"],
    noveltyLevel: "hidden-gem",
    indoorOutdoor: "outdoor",
    estimatedDuration: "45 minutes",
    rating: "4.5 ★",
    trendScore: 85,
    trendReason: "Less crowded heritage add-on near Amer.",
    imageCategory: "historical landmarks",
  },
  {
    id: "jaipur-jawahar-kala-kendra",
    city: "Jaipur",
    title: "Jawahar Kala Kendra Art Break",
    neighborhood: "JLN Marg",
    address: "Jawahar Kala Kendra, JLN Marg, Jaipur",
    type: "historical",
    tags: ["art", "architecture", "culture", "indoor"],
    moodTags: ["Cultural", "Peaceful", "Solo", "Relaxed"],
    budgetTier: "budget",
    groupFit: ["Solo", "Couple", "Small Group"],
    noveltyLevel: "niche",
    indoorOutdoor: "mixed",
    estimatedDuration: "1.5 hours",
    rating: "4.6 ★",
    trendScore: 79,
    trendReason: "Architectural and cultural stop beyond forts and palaces.",
    imageCategory: "historical landmarks",
  },
  {
    id: "mussoorie-landour",
    city: "Mussoorie",
    title: "Landour Bakehouse And Sister's Bazaar Walk",
    neighborhood: "Landour",
    address: "Sister's Bazaar, Landour, Mussoorie",
    type: "cafe",
    tags: ["bakery", "walk", "mountain", "local"],
    moodTags: ["Romantic", "Peaceful", "Foodie", "Relaxed"],
    budgetTier: "mid-range",
    groupFit: ["Solo", "Couple", "Small Group"],
    noveltyLevel: "popular-local",
    indoorOutdoor: "mixed",
    estimatedDuration: "2 hours",
    rating: "4.7 ★",
    trendScore: 87,
    trendReason: "High-fit mountain cafe and walk combination.",
    imageCategory: "cafe atmosphere",
  },
  {
    id: "goa-fontainhas",
    city: "Goa",
    title: "Fontainhas Color Walk",
    neighborhood: "Panjim",
    address: "Fontainhas, Panaji, Goa",
    type: "exploring",
    tags: ["heritage", "photos", "walkable", "colorful"],
    moodTags: ["Romantic", "Cultural", "Exploring", "Relaxed"],
    budgetTier: "free",
    groupFit: ["Solo", "Couple", "Small Group"],
    noveltyLevel: "popular-local",
    indoorOutdoor: "outdoor",
    estimatedDuration: "1.5 hours",
    rating: "4.6 ★",
    trendScore: 89,
    trendReason: "Walkable heritage area with strong visual appeal.",
    imageCategory: "city exploration",
  },
  {
    id: "mumbai-khotachiwadi",
    city: "Mumbai",
    title: "Khotachiwadi Heritage Lane",
    neighborhood: "Girgaon",
    address: "Khotachiwadi, Girgaon, Mumbai",
    type: "historical",
    tags: ["heritage", "architecture", "quiet", "local"],
    moodTags: ["Cultural", "Peaceful", "Exploring"],
    budgetTier: "free",
    groupFit: ["Solo", "Couple", "Small Group"],
    noveltyLevel: "niche",
    indoorOutdoor: "outdoor",
    estimatedDuration: "1 hour",
    rating: "4.4 ★",
    trendScore: 77,
    trendReason: "A compact heritage detour away from the default promenade plan.",
    imageCategory: "historical landmarks",
  },
  {
    id: "bengaluru-church-street",
    city: "Bengaluru",
    title: "Church Street Books And Coffee Trail",
    neighborhood: "Central Bengaluru",
    address: "Church Street, Bengaluru",
    type: "cafe",
    tags: ["bookstores", "coffee", "walkable", "social"],
    moodTags: ["Social", "Foodie", "Relaxed", "Cultural"],
    budgetTier: "mid-range",
    groupFit: ["Solo", "Couple", "Small Group"],
    noveltyLevel: "popular-local",
    indoorOutdoor: "mixed",
    estimatedDuration: "2 hours",
    rating: "4.6 ★",
    trendScore: 86,
    trendReason: "Dense walkable cluster for cafes, bookstores, and casual plans.",
    imageCategory: "cafe atmosphere",
  },
];

export function getCandidatesForLocation(location: string): CityCandidate[] {
  const normalized = location.toLowerCase();
  const exact = candidates.filter((candidate) => normalized.includes(candidate.city.toLowerCase()));

  if (exact.length > 0) {
    return exact;
  }

  return candidates.filter((candidate) =>
    ["Delhi", "Noida", "Jaipur", "Mussoorie", "Goa"].includes(candidate.city)
  );
}

export function getTrendingCandidates(location: string, limit = 8): CityCandidate[] {
  return [...getCandidatesForLocation(location)]
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit);
}

