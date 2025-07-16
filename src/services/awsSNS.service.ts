import { PublishCommand } from "@aws-sdk/client-sns";
import snsClient from "../config/AWS.config";

class awsSNSService {
  sendOtpSMS = async (phoneNumber: string, otp: string) => {
    const message = `${otp} is your One time password (OTP) to login to PraveshEvents. Don't share OTP with anyone.
Please enter the OTP to proceed.`;

    const command = new PublishCommand({
      Message: message,
      PhoneNumber: phoneNumber,
    });

    try {
      const result = await snsClient.send(command);
      console.log("Message sent:", result);
      return result;
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    }
  };
}
export const AwsSNSService = new awsSNSService();
