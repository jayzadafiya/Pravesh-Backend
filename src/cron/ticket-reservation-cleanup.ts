import cron from "node-cron";
import { TicketReservationService } from "../services/ticket-reservation.service";

cron.schedule("* * * * *", async () => {
  try {
    const cleanedCount =
      await TicketReservationService.cleanupExpiredReservations();

    if (cleanedCount > 0) {
      console.log(
        `[${new Date().toISOString()}] Ticket Reservation Cleanup: ${cleanedCount} expired reservations processed`
      );
    }
  } catch (error: any) {
    console.error(
      `[${new Date().toISOString()}] Ticket Reservation Cleanup failed:`,
      error.message
    );
  }
});

console.log(
  "Ticket reservation cleanup cron job initialized - runs every minute"
);
