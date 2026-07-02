interface RecommendationEventInput {
  eventType: string;
  entityType?: string;
  entityId?: string;
  city?: string;
  candidateId?: string;
  activityId?: string;
  recommendationId?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export function trackRecommendationEvent(event: RecommendationEventInput) {
  void fetch("/api/recommendation-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch((error) => {
    console.debug("Recommendation event tracking failed", error);
  });
}

