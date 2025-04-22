import axios from "axios";

class whatsappService {
  async sendOTPMessage(OTP: number, phone: string) {
    // Send message
    const API_KEY = process.env.WHATSAPP_API_KEY;
    const whatsappAPI =
      process.env.WHATSAPP_URL + process.env.PHONE_NUMBER_ID! + "/message";
    console.log(whatsappAPI);
    await axios.post(
      whatsappAPI,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "91" + phone,
        type: "text",
        text: {
          preview_url: false,
          body: `Your OTP is: ${OTP}`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
  }

  async sendQRMessage(phone: string, imageUrl: string, caption?: string) {
    const API_KEY = process.env.WHATSAPP_API_KEY;
    const whatsappAPI =
      process.env.WHATSAPP_URL + process.env.PHONE_NUMBER_ID! + "/messages";

    await axios.post(
      whatsappAPI,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "91" + phone,
        type: "image",
        image: {
          link: imageUrl,
          caption: caption || "Here is your QR code!",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export const WhatsappService = new whatsappService();
