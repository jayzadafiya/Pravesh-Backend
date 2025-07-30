import { CASHFREE_CONFIG } from "../config/cashfree.config";
import crypto from "crypto";
import axios from "axios";

class cashFreeService {
  private getBaseUrl(): string {
    return CASHFREE_CONFIG.environment === "PRODUCTION"
      ? "https://api.cashfree.com/pg"
      : "https://sandbox.cashfree.com/pg";
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "x-api-version": CASHFREE_CONFIG.apiVersion,
      "x-client-id": CASHFREE_CONFIG.appId,
      "x-client-secret": CASHFREE_CONFIG.secretKey,
    };
  }

  private validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.protocol === "https:" ||
        (urlObj.hostname === "localhost" &&
          CASHFREE_CONFIG.environment === "SANDBOX")
      );
    } catch {
      return false;
    }
  }

  createPaymentOrder = async (
    amount: number,
    currency: string = "INR",
    orderId: string,
    customerDetails: {
      customer_id: string;
      customer_email?: string;
      customer_phone: string;
      customer_name?: string;
    }
  ) => {
    try {
      const baseReturnUrl = "http://localhost:5173/payment/success";
      // process.env.CASHFREE_RETURN_URL ||
      const baseWebhookUrl =
        "http://localhost:3000/api/v1/payment/cashfree/webhook";
      // process.env.CASHFREE_WEBHOOK_URL ||

      const returnUrl =
        CASHFREE_CONFIG.environment === "SANDBOX" &&
        process.env.NODE_ENV === "development"
          ? process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/payment/success`
            : baseReturnUrl
          : baseReturnUrl;

      const webhookUrl =
        CASHFREE_CONFIG.environment === "SANDBOX" &&
        process.env.NODE_ENV === "development"
          ? process.env.BACKEND_URL
            ? `${process.env.BACKEND_URL}/payment/cashfree/webhook`
            : baseWebhookUrl
          : baseWebhookUrl;

      if (!this.validateUrl(returnUrl)) {
        throw new Error(`Invalid return URL format: ${returnUrl}`);
      }
      if (!this.validateUrl(webhookUrl)) {
        throw new Error(`Invalid webhook URL format: ${webhookUrl}`);
      }

      if (CASHFREE_CONFIG.environment === "SANDBOX") {
        console.log("Cashfree URLs:", { returnUrl, webhookUrl });
      }

      const orderRequest = {
        order_id: orderId,
        order_amount: amount,
        order_currency: currency,
        customer_details: {
          customer_id: customerDetails.customer_id,
          customer_email: customerDetails.customer_email || "",
          customer_phone: customerDetails.customer_phone,
          customer_name: customerDetails.customer_name || "",
        },
        order_meta: {
          return_url: returnUrl,
          notify_url: webhookUrl,
        },
      };

      const response = await axios.post(
        `${this.getBaseUrl()}/orders`,
        orderRequest,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Cashfree order creation error:",
        error?.response?.data || error.message
      );
      throw new Error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to create Cashfree order"
      );
    }
  };

  verifyPaymentSignature = (
    orderId: string,
    orderAmount: string,
    referenceId: string,
    paymentStatus: string,
    paymentMode: string,
    paymentTime: string,
    signature: string
  ): boolean => {
    try {
      const signatureData = `${orderId}${orderAmount}${referenceId}${paymentStatus}${paymentMode}${paymentTime}`;
      const expectedSignature = crypto
        .createHmac("sha256", CASHFREE_CONFIG.secretKey)
        .update(signatureData)
        .digest("base64");

      return expectedSignature === signature;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  };

  verifyWebhookSignature = (
    rawBody: string,
    signature: string,
    timestamp: string
  ): boolean => {
    try {
      const expectedSignature = crypto
        .createHmac("sha256", CASHFREE_CONFIG.secretKey)
        .update(timestamp + rawBody)
        .digest("base64");

      return expectedSignature === signature;
    } catch (error) {
      console.error("Webhook signature verification error:", error);
      return false;
    }
  };

  verifyPaymentViaAPI = async (orderId: string) => {
    try {
      const response = await axios.get(
        `${this.getBaseUrl()}/orders/${orderId}`,
        { headers: this.getHeaders() }
      );

      const orderData = response.data;

      return {
        isValid: true,
        isPaid: orderData.order_status === "PAID",
        status: orderData.order_status,
        paymentStatus: orderData.payment_status,
        orderAmount: orderData.order_amount,
        paidAmount: orderData.paid_amount,
        orderData: orderData,
      };
    } catch (error: any) {
      console.error(
        "Error verifying payment via API:",
        error?.response?.data || error.message
      );
      return {
        isValid: false,
        isPaid: false,
        error: error?.response?.data?.message || error.message,
      };
    }
  };

  getPaymentDetails = async (orderId: string, paymentId: string) => {
    try {
      const response = await axios.get(
        `${this.getBaseUrl()}/orders/${orderId}/payments/${paymentId}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching payment details:",
        error?.response?.data || error.message
      );
      throw new Error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch payment details"
      );
    }
  };

  getOrderDetails = async (orderId: string) => {
    try {
      const response = await axios.get(
        `${this.getBaseUrl()}/orders/${orderId}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching order details:",
        error?.response?.data || error.message
      );
      throw new Error(
        error?.response?.data?.message ||
          error.message ||
          "Failed to fetch order details"
      );
    }
  };

  generateOrderId = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `ORDER_${timestamp}_${random}`;
  };
}

export const CashFreeService = new cashFreeService();
