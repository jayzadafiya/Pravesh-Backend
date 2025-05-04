import moment from "moment";
import * as QrCode from "qrcode";
import { CloudinaryService } from "./cloudinary.service";

class qrService {
  generateQRCode = async (userId: string) => {
    const buffer: Buffer = await QrCode.toBuffer(userId, {
      color: {
        dark: "#000",
        light: "#f5f5f5",
      },
      scale: 3,
      width: 300,
      margin: 5,
    });

    const fileName = `${userId}`;

    const result = await CloudinaryService.uploadImage(
      buffer,
      fileName,
      "QRCodes"
    );
    console.log("Uploaded QR URL:", result.secure_url);

    return result.secure_url;
  };
}

export const QRService = new qrService();
