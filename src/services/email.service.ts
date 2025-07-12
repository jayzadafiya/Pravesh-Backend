import path from "path";
import fs from "fs";
import { transporter } from "../config/email.config";
import { BadRequestException } from "../utils/exceptions";

class emailService {
  sendAuthEmail = async (to: string, token: string) => {
    try {
      const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
      const verifyUrl = `${BACKEND_URL}/auth/verify?token=${token}`;

      const templatePath = path.join(
        __dirname,
        "../templates/email-verification.html"
      );
      let htmlTemplate = fs.readFileSync(templatePath, "utf8");

      htmlTemplate = htmlTemplate.replace(/{{verifyUrl}}/g, verifyUrl);

      const info = await transporter.sendMail({
        from: `"Prevesh Events" <${process.env.PRAVESH_INFO_EMAIL}>`,
        to,
        subject: "Your Authentication Token",
        html: htmlTemplate,
      });

      console.log(`Message sent: ${info.messageId}`);
    } catch (error: any) {
      console.error(`Error sending email: ${error.message}`);
      throw new BadRequestException(`Failed to send email: ${error.message}`);
    }
  };
}

export const EmailService = new emailService();
