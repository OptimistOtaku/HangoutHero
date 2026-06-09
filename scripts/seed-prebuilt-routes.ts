import { db } from "../server/db.js";
import { DEFAULT_PREBUILT_ROUTES } from "../server/prebuilt-routes.js";
import { prebuiltRoutes } from "../shared/schema.js";

async function main() {
  if (!db) {
    throw new Error("DATABASE_URL is required to seed prebuilt routes.");
  }

  for (const route of DEFAULT_PREBUILT_ROUTES) {
    await db
      .insert(prebuiltRoutes)
      .values(route)
      .onConflictDoUpdate({
        target: prebuiltRoutes.slug,
        set: {
          city: route.city,
          mood: route.mood,
          stops: route.stops,
          accent: route.accent,
          image: route.image,
          tagline: route.tagline,
          itinerary: route.itinerary,
          sortOrder: route.sortOrder,
        },
      });
  }

  console.log(`Seeded ${DEFAULT_PREBUILT_ROUTES.length} prebuilt routes.`);
}

main().catch((error) => {
  console.error("Failed to seed prebuilt routes:", error);
  process.exit(1);
});
