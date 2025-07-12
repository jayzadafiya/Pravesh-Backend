import cron from "node-cron";
import axios from "axios";

cron.schedule("*/5 * * * *", async () => {
  const urlToPing = `${
    process.env.BACKEND_URL || "http://localhost:3000"
  }/ping`;

  try {
    const response = await axios.get(urlToPing);
    console.log(
      `[${new Date().toISOString()}] Ping success: ${response.status}`
    );
  } catch (error: any) {
    console.log(error);
    console.error(`[${new Date().toISOString()}] Ping failed:`, error.message);
  }
});
