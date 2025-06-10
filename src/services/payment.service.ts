import Razorpay from "razorpay";
import crypto from "crypto";

class paymentService {
  private static razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
  });

  fetchPaymentDetails = async (paymentId: string) => {
    return await paymentService.razorpayInstance.payments.fetch(paymentId);
  };

  createPaymentIntent = async (amount: number, currency: string = "INR") => {
    const options = {
      amount: amount * 100,
      currency,
      payment_capture: 1,
    };

    return await paymentService.razorpayInstance.orders.create(options);
  };

  verifyPaymentSignature = async (orderId: string, paymentId: string) => {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY!)
      .update(body.toString())
      .digest("hex");

    return expectedSignature;
  };
}

export const PaymentService = new paymentService();
