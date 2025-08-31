import axios from "axios";

class whatsappService {
  async sendOTPMessage(OTP: number, phone: string) {
    try {
      const API_KEY = process.env.WHATSAPP_API_KEY;
      const whatsappAPI =
        process.env.WHATSAPP_URL + process.env.PHONE_NUMBER_ID! + "/messages";

      console.log("=== WhatsApp Debug Info ===");
      console.log("Phone Number (input):", phone);
      console.log("Phone Number (with +91):", "91" + phone);
      console.log("Phone Number (alternative format):", "+91" + phone);
      console.log("API URL:", whatsappAPI);
      console.log("OTP:", OTP);

      // Try template first, then fallback to text message
      try {
        const response = await axios.post(
          whatsappAPI,
          {
            messaging_product: "whatsapp",
            to: "91" + phone,
            type: "template",
            template: {
              name: "pravesh_auth",
              language: {
                code: "en",
              },
              components: [
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: OTP.toString(),
                    },
                  ],
                },
                {
                  type: "button",
                  sub_type: "url",
                  index: "0",
                  parameters: [
                    {
                      type: "text",
                      text: OTP.toString(), // Replace this with actual URL parameter if needed
                    },
                  ],
                },
              ],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("WhatsApp template sent successfully:");
        console.log("Message ID:", response.data.messages?.[0]?.id);
        console.log(
          "Message Status:",
          response.data.messages?.[0]?.message_status
        );
        console.log("Full Response:", JSON.stringify(response.data, null, 2));
        return response.data;
      } catch (templateError: any) {
        console.log("Template failed, sending as text message...");
        console.log("Template Error:", templateError.response?.data);

        // Fallback to text message
        const response = await axios.post(
          whatsappAPI,
          {
            messaging_product: "whatsapp",
            to: "91" + phone,
            type: "text",
            text: {
              body: `Your Pravesh OTP is: ${OTP}. Do not share this with anyone.`,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("WhatsApp text message sent successfully:");
        console.log("Message ID:", response.data.messages?.[0]?.id);
        console.log(
          "Message Status:",
          response.data.messages?.[0]?.message_status
        );
        console.log("Full Response:", JSON.stringify(response.data, null, 2));
        return response.data;
      }
    } catch (error: any) {
      console.error(
        "WhatsApp API Error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

export const WhatsappService = new whatsappService();
