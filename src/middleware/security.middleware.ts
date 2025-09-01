import { Request, Response, NextFunction } from "express";

// IP address validation middleware
export const validateIPAddress = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientIP = req.ip || req.connection.remoteAddress || "";

  // Block private IP ranges in production (except local development)
  if (process.env.MAIN_ENVIRONMENT === "production") {
    const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;
    if (privateIPRegex.test(clientIP) && !process.env.ALLOW_PRIVATE_IPS) {
      console.warn(`🚨 Private IP access blocked: ${clientIP}`);
      res.status(403).json({ error: "Access denied from private IP" });
      return;
    }
  }

  next();
};

// Request size validation middleware
export const validateRequestSize = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contentLength = parseInt(req.get("Content-Length") || "0");
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    console.warn(
      `🚨 Large request blocked: ${contentLength} bytes from ${req.ip}`
    );
    res.status(413).json({
      error: "Request entity too large",
      maxSize: "10MB",
    });
    return;
  }

  next();
};

// Bot protection middleware
export const botProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userAgent = req.get("User-Agent") || "";

  // Block empty user agents
  if (!userAgent.trim()) {
    console.warn(`🚨 Empty user agent blocked from ${req.ip}`);
    res.status(403).json({ error: "Valid user agent required" });
    return;
  }

  // Block known bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
  ];

  // Allow legitimate bots but log them
  const legitimateBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
  ];

  const isBot = botPatterns.some((pattern) => pattern.test(userAgent));
  const isLegitimateBot = legitimateBots.some((pattern) =>
    pattern.test(userAgent)
  );

  if (isBot && !isLegitimateBot) {
    console.warn(`🚨 Bot access detected: ${userAgent} from ${req.ip}`);
    // Don't block completely, but add delay and log
    setTimeout(() => next(), 1000); // 1 second delay
    return;
  }

  if (isLegitimateBot) {
    console.log(`🤖 Legitimate bot access: ${userAgent} from ${req.ip}`);
  }

  next();
};

// Geolocation-based security (placeholder for future implementation)
export const geolocationSecurity = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // TODO: Implement geolocation-based blocking
  // This would require a service like MaxMind GeoIP2
  next();
};

// Advanced request validation
export const advancedRequestValidation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check for suspicious URL patterns
  const suspiciousPatterns = [
    /\.(php|asp|jsp|cgi)$/i,
    /\/admin\//i,
    /\/wp-admin\//i,
    /\/phpmyadmin\//i,
    /\/xmlrpc\.php/i,
    /\/\.env/i,
    /\/\.git\//i,
    /\/config\./i,
    /\/backup/i,
    /\/database/i,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(req.path))) {
    console.warn(
      `🚨 Suspicious URL pattern detected: ${req.path} from ${req.ip}`
    );
    res.status(404).json({ error: "Not found" });
    return;
  }

  // Check for suspicious query parameters
  const suspiciousParams = ["exec", "system", "shell", "cmd", "eval"];
  const queryKeys = Object.keys(req.query);

  if (suspiciousParams.some((param) => queryKeys.includes(param))) {
    console.warn(
      `🚨 Suspicious query parameters detected from ${req.ip}:`,
      req.query
    );
    res.status(400).json({ error: "Invalid parameters" });
    return;
  }

  next();
};

// Request timing analysis
const requestTimings = new Map<string, number[]>();

export const requestTimingAnalysis = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientIP = req.ip || "";
  const now = Date.now();

  if (!requestTimings.has(clientIP)) {
    requestTimings.set(clientIP, []);
  }

  const timings = requestTimings.get(clientIP)!;
  timings.push(now);

  // Keep only last 10 requests
  if (timings.length > 10) {
    timings.shift();
  }

  // Detect rapid-fire requests (more than 5 requests in 1 second)
  const recentRequests = timings.filter((time) => now - time < 1000);
  if (recentRequests.length > 20) {
    console.warn(
      `🚨 Rapid requests detected from ${clientIP}: ${recentRequests.length} requests in 1 second`
    );
    res.status(429).json({
      error: "Too many requests too quickly",
      retryAfter: "1 second",
    });
    return;
  }

  next();
};

// Clean up old timing data every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  for (const [ip, timings] of requestTimings.entries()) {
    const recentTimings = timings.filter((time) => time > fiveMinutesAgo);
    if (recentTimings.length === 0) {
      requestTimings.delete(ip);
    } else {
      requestTimings.set(ip, recentTimings);
    }
  }
}, 5 * 60 * 1000);

// Security audit logging
export const securityAuditLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const securityEvents = {
    authentication: ["/api/v1/auth"],
    payment: ["/api/v1/payment"],
    admin: ["/api/v1/admin"],

    sensitive: [
      "/api/v1/tickets",
      "/api/v1/users",
      "/api/v1/organization",
      "/api/v1/organizer-registration",
    ],
  };

  const path = req.path;
  let eventType = "general";

  for (const [type, paths] of Object.entries(securityEvents)) {
    if (paths.some((p) => path.startsWith(p))) {
      eventType = type;
      break;
    }
  }

  if (eventType !== "general") {
    const auditLog = {
      timestamp: new Date().toISOString(),
      eventType,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      referer: req.get("Referer"),
      requestId: req.id,
    };

    console.log(`🔍 Security audit [${eventType.toUpperCase()}]:`, auditLog);
  }

  next();
};

export default {
  validateIPAddress,
  validateRequestSize,
  botProtection,
  geolocationSecurity,
  advancedRequestValidation,
  requestTimingAnalysis,
  securityAuditLogger,
};
