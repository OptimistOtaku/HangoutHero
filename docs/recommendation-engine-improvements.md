# Recommendation Engine Improvement Roadmap

## Current State

HangoutHero currently generates recommendations as part of `POST /api/generate-itinerary` in `server/routes.ts`.

The engine uses:

- Explicit preference inputs: hangout types, duration, budget, group size, mood.
- Location inputs: city or neighborhood, distance preference, transport modes.
- Gemini prompt generation when `GEMINI_API_KEY` is configured.
- Static city/default fallback itineraries when Gemini is unavailable.
- A normalized response shape with six activities and three follow-on recommendations.
- Google place photo proxying for richer images.

The recommendations are not yet produced by a separate ranking engine. They are prompt-generated or static fallback items, then displayed as "Next Route Ideas" in the results page.

## Feature Branch Direction

For the feature branch, optimize for the best itinerary quality and fast generation. Cost control should remain a guardrail, but it should not block richer candidate retrieval, Gemini planning, place enrichment, or trending signals while we are proving the product experience.

The target generation flow should be:

1. Load matching curated, trending, and recently successful candidates from the database.
2. Ask Gemini to intelligently compose the itinerary using those grounded candidates.
3. Validate and rerank the output locally for novelty, fit, diversity, travel practicality, and trending relevance.
4. Return the itinerary quickly, then save/cache the result for future reuse.

The default should be "Gemini-assisted planning with strong candidate grounding," not cache-only generation.

## Highest-Impact Improvements

### 1. Add an explicit scoring layer after generation

Do not rely only on the model prompt to decide quality. After Gemini or fallback generation, run each activity and recommendation through a deterministic score.

Suggested scoring dimensions:

- Preference match: selected hangout types and mood.
- Budget fit: price category versus selected budget.
- Duration fit: total route length and stop count.
- Distance fit: walking/moderate/any-distance constraint.
- Transport fit: walking, transit, rideshare, driving.
- Group fit: solo safety, couple ambiance, large-group capacity.
- Variety: avoid six stops of the same type.
- Practicality: avoid excessive backtracking and unrealistic timing.
- Confidence: whether the place has exact location, image, rating, and plausible description.

Implementation path:

- Add `server/recommendation-scoring.ts`.
- Export `scoreItinerary`, `scoreActivity`, and `scoreRecommendation`.
- Add optional fields such as `score`, `scoreBreakdown`, and `matchReasons` to the response schema.
- Sort or replace weak recommendations before returning the itinerary.

### 2. Use a candidate pool instead of asking the model for final answers only

The prompt currently asks Gemini to directly produce the final itinerary and three recommendations. A better pattern is candidate generation followed by deterministic selection.

Implementation path:

- Ask Gemini for 12-18 candidate places with tags, estimated cost, ideal group size, travel area, and best time of day.
- Score candidates locally.
- Select six activities using constraints: two morning, two afternoon, two evening, enough category diversity, and reasonable budget/travel fit.
- Generate three "next route" recommendations from unused high-scoring clusters.

This makes the app easier to debug because bad results can be traced to candidate quality versus ranking quality.

### 2a. Improve the Gemini prompt for novelty and niche discovery

The current Gemini prompt asks for specific, realistic places, but it does not strongly discourage repeated tourist defaults. Add explicit discovery rules so the model balances recognizable anchors with lesser-known local picks.

Recommended prompt additions:

```txt
Discovery requirements:
- Do not default to the most famous tourist attractions unless they are an unusually strong fit for the user's preferences.
- Include at least 2 lesser-known, niche, local, or neighborhood-specific places in the activity list.
- Include at least 1 place that locals would realistically recommend but first-time travel blogs may miss.
- Avoid repeating common city defaults across generations. Prefer fresh neighborhoods, independent cafes, small galleries, local markets, workshops, community spaces, scenic side streets, bookstores, cultural centers, and activity-led venues.
- Balance the plan as 40% recognizable anchor spots and 60% fresh/local discoveries unless the user explicitly asks for iconic sightseeing.
- Each activity must explain why it fits the selected mood, group size, budget, and transport mode.
- If a suggested place is niche, include a nearby landmark or neighborhood in the location field so it is findable.
- Do not invent venues. If unsure about a venue name, use a neighborhood/activity description instead of a fake proper noun.
```

Also ask Gemini to return metadata that supports local reranking:

```json
{
  "noveltyLevel": "iconic | popular-local | hidden-gem | niche",
  "tags": ["foodie", "quiet", "walkable", "date-friendly"],
  "whyThisFits": ["Matches Foodie mood", "Works for Small Group", "Low travel friction"],
  "neighborhood": "string",
  "indoorOutdoor": "indoor | outdoor | mixed",
  "estimatedTravelFromPrevious": "string"
}
```

This should be paired with deterministic checks. If Gemini returns six iconic places, the server should lower the score and swap in local/niche fallback candidates.

### 3. Capture user feedback signals

The app has natural behavior signals, but they are not persisted as recommendation feedback.

Useful events:

- Generated itinerary.
- Saved itinerary.
- Shared itinerary.
- Deleted itinerary.
- Opened a recommendation card.
- Bookmarked an activity.
- Edited journal notes.
- Planned another hangout from results.

Implementation path:

- Add a `recommendation_events` table with `userId`, `itineraryId`, `eventType`, `entityType`, `entityId`, `metadata`, and `createdAt`.
- Track explicit clicks from `RecommendationCard`.
- Track saves/deletes server-side in existing endpoints.
- Use event counts initially as simple boosts before building ML-style personalization.

### 4. Personalize from saved history

Saved itineraries already exist in storage, but new generations do not consider them.

Use saved history to infer:

- Favorite cities or neighborhoods.
- Repeated activity types.
- Preferred budget range.
- Preferred route length.
- Saved versus deleted route patterns.
- Places already visited, to avoid repetition unless requested.

Implementation path:

- Add a server helper that loads recent saved itineraries for the user.
- Summarize the history into compact preference features.
- Add those features to the prompt and scoring layer.
- Penalize duplicate places from recent itineraries.

### 5. Make recommendations actionable, not just search links

Recommendation cards currently open a web search for the recommendation title. That is useful for inspiration, but it does not create another itinerary.

Implementation path:

- Store enough metadata on each recommendation to regenerate a route: city, mood, tags, duration, budget hint, and seed places.
- Change "View Details" into a route action such as "Build This Route".
- Add `POST /api/generate-itinerary` support for an optional `seedRecommendation`.
- Pre-fill questionnaire/location state when a user selects a recommendation.

### 6. Add place validation and enrichment

The model can invent or misplace venues. The app already uses Google APIs for autocomplete/photos, so the next step is to validate generated places.

Implementation path:

- Use Google Places details/search for each generated venue.
- Keep verified name, address, coordinates, rating, price level, open hours, and place id.
- Penalize or replace unverified candidates.
- Use coordinates to calculate travel ordering and rough route distance.

### 7. Improve fallback generation

The static fallback path is city-specific for a few cities and otherwise generic. It also does not deeply adapt to selected mood, group size, budget, or transport.

Implementation path:

- Convert fallback data into tagged place/route candidates.
- Score fallback candidates with the same scoring layer used for Gemini output.
- Expand `server/prebuilt-routes.ts` with tags instead of only final itineraries.
- Use preference-aware assembly even when Gemini is unavailable.

### 7a. Expand itinerary supply with curated city packs

Better prompts help, but repeated results usually mean the app needs a deeper supply of known places. Build city packs that Gemini and fallback logic can draw from.

For each supported city, maintain a curated list of candidates:

- Iconic anchors: major landmarks and reliable first-visit stops.
- Local favorites: markets, food streets, independent cafes, bookstores, art spaces, public gardens.
- Niche activities: workshops, pottery, comedy clubs, board-game cafes, heritage walks, record stores, community events, micro-museums.
- Weather-safe options: indoor alternatives for rain, heat, or poor air.
- Group-fit options: solo-safe, date-friendly, large-group-friendly, family-friendly.
- Budget tiers: free, budget, mid-range, luxury.
- Neighborhood clusters: places that can be combined without long travel jumps.

Implementation path:

- Add `server/city-candidates.ts` or a `city_candidates` database table.
- Start with 30-50 tagged candidates each for Delhi, Noida, Jaipur, Mussoorie, Goa, Mumbai, Bengaluru, Pune, Kolkata, Hyderabad, and Chennai.
- Pass only the top relevant candidates into the Gemini prompt to ground the model.
- Let Gemini compose the itinerary, but let local scoring choose and validate the final route.
- Track which candidates have appeared recently and apply a recency penalty to reduce repetition.

### 8. Introduce explainability in the UI

Users will trust recommendations more when they can see why a route fits.

Examples:

- "Matches Foodie + Social mood"
- "Mostly walkable"
- "Good for large groups"
- "Budget-friendly stops"
- "Low travel friction"

Implementation path:

- Add `matchReasons: string[]` to activities and recommendations.
- Render two or three compact badges on cards.
- Generate reasons from the scoring layer, not free-form model text.

## Medium-Term Improvements

### Build route optimization

Once coordinates are available, order stops by geography and opening windows instead of relying on prompt order.

Inputs:

- Coordinates.
- Opening hours.
- Time of day.
- Transport mode.
- Distance preference.

Output:

- Lower travel time.
- Better route sequence.
- Warnings when a selected distance preference is impossible.

### Add diversity controls

Prevent repetitive itineraries by enforcing diversity during selection.

Rules:

- No more than two consecutive activities of the same type.
- At least one food/rest stop for half-day and full-day plans.
- Respect selected hangout type mix but avoid overfitting one tag.
- Keep a backup candidate for every time slot.

### Add weather and season awareness

The app already has a weather endpoint. Feed weather into generation and scoring.

Examples:

- Prefer indoor stops during heat, rain, or poor air quality.
- Recommend sunrise/sunset/viewpoint stops only when weather supports it.
- Add timing warnings for outdoor-heavy routes.

### Add evaluation fixtures

Recommendation quality will regress without fixtures.

Create a small offline evaluation suite:

- Inputs for Delhi, Noida, Jaipur, Mussoorie, Goa, and an unsupported city.
- Scoring assertions for budget, group size, transport, and mood.
- Snapshot checks for response shape and reason badges.
- Guardrails for duplicate titles, missing addresses, and impossible timings.

## Suggested First Sprint

1. Add `scoreActivity` and `scoreRecommendation`.
2. Add `matchReasons` to normalized generated data.
3. Sort follow-on recommendations by score.
4. Track recommendation-card clicks.
5. Add a small test fixture for scoring.

This gives immediate quality gains without changing the full product flow or requiring a new data provider.

## Feature Branch Implementation Plan

### 1. Candidate-grounded Gemini planning

Keep Gemini as the main planner, but stop making it discover everything from scratch.

Implementation:

- Build a candidate set before calling Gemini.
- Candidate sources should include curated city candidates, trending places, recently high-performing saved/generated itineraries, and existing prebuilt routes.
- Pass the best 12-20 candidates into the prompt with their tags, neighborhood, novelty level, group fit, budget tier, indoor/outdoor flag, and trend score.
- Ask Gemini to select and sequence the final 6 activities from the candidate set where possible.
- Allow Gemini to add at most 1-2 new places if the candidate set is weak, but require them to be clearly marked as model-suggested.

### 2. Fast path with intelligent cache reuse

Use cached/common itineraries to speed things up, but do not let cache reuse make the product stale.

Implementation:

- Compute an exact preference cache key and a looser similarity key.
- If there is a strong exact cached match, send it to Gemini for a fast freshness pass instead of returning it unchanged.
- The freshness pass should swap or rewrite 1-2 stops only when it improves novelty, trend fit, or preference match.
- If no strong cache exists, use fresh Gemini planning with grounded candidates.

### 3. Trending places for route quality

Trending places should improve itinerary quality, not just appear as a separate UI section.

Implementation:

- Add trending candidates into the same candidate pool used by Gemini.
- Store `trendScore`, `trendReason`, `lastTrendRefreshAt`, and `trendSource`.
- Use trend score as a boost, not an override. A trending place still needs to fit mood, budget, group size, distance, and transport.
- Add a "Trending nearby" or "Trending in this city" section to the results page using the same data.

### 4. Local reranking and quality gates

Gemini should compose the itinerary, but the server should still protect quality.

Implementation:

- Score every generated activity and recommendation after Gemini returns JSON.
- Enforce minimum quality gates:
  - No duplicate place titles.
  - At least 2 niche/local candidates when enough supply exists.
  - No more than 3 iconic places in a 6-stop plan unless the user asks for sightseeing.
  - At least one food/rest stop for half-day and full-day routes.
  - Avoid obvious travel backtracking when coordinates are available.
- If a generated item fails validation, replace it with the next-best scored candidate and regenerate only the affected description if needed.

### 5. Frontend support

Expose the new intelligence in the UI.

Implementation:

- Show badges for `matchReasons`, `noveltyLevel`, and trending status.
- Add "Build This Route" to recommendation cards.
- Add a trending places section with "Add to route" or "Build around this" actions.
- Track recommendation clicks and trending interactions as feedback events.

### 6. Performance target

Aim for fast perceived generation:

- Candidate fetch and cache lookup should happen before the Gemini call.
- Gemini prompt should be compact and structured, with only the top candidates included.
- Return in a single API call for v1.
- Defer non-critical enrichment, analytics, and trend refreshes until after the response where possible.

Target behavior:

- Common city with candidates/cache: fast Gemini adaptation.
- Common city without cache: grounded Gemini planning.
- Unsupported city: fresh Gemini planning with stricter validation.

## Suggested Data Model Additions

```ts
type ScoredRecommendation = Recommendation & {
  score: number;
  matchReasons: string[];
  tags: string[];
  city?: string;
  seedPreferences?: {
    hangoutTypes?: string[];
    mood?: string[];
    duration?: string;
    budget?: string;
  };
};
```

```ts
type RecommendationEvent = {
  userId?: number;
  itineraryId?: number;
  eventType: "generated" | "saved" | "shared" | "deleted" | "opened_recommendation" | "bookmarked_activity";
  entityType: "itinerary" | "activity" | "recommendation";
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};
```

## Priority Ranking

| Priority | Improvement | Why |
| --- | --- | --- |
| P0 | Explicit scoring layer | Biggest quality/debuggability gain with low architectural risk |
| P0 | Feedback events | Creates data needed for personalization |
| P0 | Gemini novelty prompt rules | Quick win for reducing repeated tourist-default outputs |
| P1 | Candidate pool + reranking | Moves recommendations from prompt-only to engine-driven |
| P1 | Curated city candidate packs | Gives the model a deeper supply of real niche places |
| P1 | Actionable recommendation cards | Turns inspiration into another planning loop |
| P1 | Place validation | Reduces hallucinated or impractical venues |
| P2 | Saved-history personalization | Strong user value once enough behavior exists |
| P2 | Weather/season awareness | Improves real-world fit |
| P2 | Evaluation fixtures | Prevents quality regression as the engine evolves |
