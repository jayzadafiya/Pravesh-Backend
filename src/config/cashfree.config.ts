import { Cashfree } from "cashfree-pg";

// For cashfree-pg v5.0.8, we need to use the correct initialization
export const cashfree = Cashfree;

// Configure environment (this will be set in the service methods)
export const CASHFREE_CONFIG = {
  appId: process.env.CASHFREE_APP_ID!,
  secretKey: process.env.CASHFREE_SECRET_KEY!,
  environment: process.env.NODE_ENV === "production" ? "PRODUCTION" : "SANDBOX",
  apiVersion: "2023-08-01",
};

// Log the environment for debugging (remove in production)
if (process.env.NODE_ENV !== "production") {
  console.log("Cashfree configured for SANDBOX environment");
} else {
  console.log("Cashfree configured for PRODUCTION environment");
}
