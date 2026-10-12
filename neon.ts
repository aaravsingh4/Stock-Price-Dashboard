import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Infrastructure as Code configuration for TradePulse Pro
  // Enforcing Postgres service only (no Auth, Object Storage, AI Gateway, or Data API)
  branch: (branch) => {
    // Retain existing branch configuration without unexpected modifications
    if (branch.exists) return {};

    // For any future production/default branch created
    if (branch.isDefault) {
      return {
        protected: true,
      };
    }

    // Default policy for development and preview branches
    return {
      postgres: {
        computeSettings: {
          autoscalingLimitMinCu: 0.25,
          autoscalingLimitMaxCu: 1,
          suspendTimeout: "5m",
        },
      },
    };
  },
});
