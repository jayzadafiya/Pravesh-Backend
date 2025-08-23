import rateLimit from "express-rate-limit";

export const securityConfig = {
  // Rate limiting configurations
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: {
        error: "Too many requests from this IP, please try again later.",
        retryAfter: "15 minutes",
      },
    },
    auth: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 10,
      message: {
        error: "Too many authentication attempts, please try again later.",
        retryAfter: "15 minutes",
      },
    },
    payment: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 10, // requests per window
      message: {
        error: "Too many payment requests, please try again later.",
        retryAfter: "5 minutes",
      },
    },
  },

  // CORS configurations
  cors: {
    allowedOrigins: [
      "http://localhost:5173",
      "http://localhost:3001",
      "https://pravesh.events",
      "https://praveshnavratri.netlify.app",
      "https://praveshevent.netlify.app",
      "https://praveshadmin.netlify.app",
      /\.pravesh\.events$/,
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "X-Forwarded-For",
    ],
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },

  // Request body limits
  bodyLimits: {
    json: "10mb",
    urlencoded: "10mb",
  },

  // HPP whitelist - parameters that are allowed to be arrays
  hppWhitelist: [
    "sort",
    "fields",
    "page",
    "limit",
    "category",
    "status",
    "tags",
  ],

  // Security headers
  headers: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-XSS-Protection": "1; mode=block",
  },

  // Monitoring thresholds
  monitoring: {
    maxMemoryUsage: 512 * 1024 * 1024, // 512MB
    requestThreshold: 1000, // requests per minute
    slowRequestThreshold: 5000, // 5 seconds
    memoryCheckInterval: 10 * 60 * 1000, // 10 minutes
    requestCountWindow: 60 * 1000, // 1 minute
  },

  // Security validations
  validation: {
    minJwtSecretLength: 32,
    maxLoginAttempts: 5,
    accountLockoutDuration: 30 * 60 * 1000, // 30 minutes
    passwordMinLength: 8,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Rate limiting middleware factory
export const createRateLimiter = (config: any) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: config.message,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  });
};

// Trusted proxy configuration
export const getTrustedProxies = () => {
  //   if (process.env.NODE_ENV === "production") {
  //     // Add your production proxy IPs here
  //     return ["127.0.0.1", "::1"];
  //   }
  return true; // Trust all proxies in development
};

// Security headers middleware
export const addSecurityHeaders = (req: any, res: any, next: any) => {
  // Remove server header
  res.removeHeader("Server");

  // Add custom security headers
  Object.entries(securityConfig.headers).forEach(([header, value]) => {
    res.setHeader(header, value);
  });

  // Add request ID for tracking
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader("X-Request-ID", req.id);

  next();
};

export default securityConfig;
