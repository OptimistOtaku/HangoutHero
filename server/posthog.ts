import { PostHog } from "posthog-node";

const posthog = process.env.POSTHOG_API_KEY
  ? new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST,
    })
  : {
      shutdown: async () => undefined,
    };

export default posthog;
