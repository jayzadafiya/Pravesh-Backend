import path from "path";
import fs from "fs";
import { transporter } from "../config/email.config";
import { BadRequestException } from "../utils/exceptions";
import moment from "moment";
import { IOrganizerRegistration } from "../interfaces/organizer-registration.interface";

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

  sendTicketConfirmationEmail = async (data: any, user: any) => {
    try {
      const templatePath = path.join(
        __dirname,
        "../templates/ticket-confirmation.html"
      );
      let htmlTemplate = fs.readFileSync(templatePath, "utf8");

      htmlTemplate = htmlTemplate.replace(
        /{{eventMainBanner}}/g,
        data?.eventMainBanner
      );
      htmlTemplate = htmlTemplate.replace(/{{eventName}}/g, data.eventName);
      htmlTemplate = htmlTemplate.replace(
        /{{eventDate}}/g,
        moment(data.eventDate).format("MMMM Do YYYY")
      );
      htmlTemplate = htmlTemplate.replace(
        /{{eventTime}}/g,
        moment(data.eventDate).format("h:mm a")
      );
      htmlTemplate = htmlTemplate.replace(/{{venueName}}/g, data.venueName);
      htmlTemplate = htmlTemplate.replace(/{{venueAddress}}/g, data.address);
      htmlTemplate = htmlTemplate.replace(
        /{{ticketCount}}/g,
        data?.ticketCount || 0
      );
      htmlTemplate = htmlTemplate.replace(/{{qrCodeUrl}}/g, user.qrCode);
      htmlTemplate = htmlTemplate.replace(
        /{{ticketId}}/g,
        data?.ticketId || "N/A"
      );
      htmlTemplate = htmlTemplate.replace(
        /{{transactionId}}/g,
        data?.paymentId || data?.transactionId || "N/A"
      );

      const info = await transporter.sendMail({
        from: `"Prevesh Events" <${process.env.PRAVESH_INFO_EMAIL}>`,
        to: user.email,
        subject: "Your Ticket Confirmation",
        html: htmlTemplate,
      });

      console.log(`Message sent: ${info.messageId}`);
    } catch (error: any) {
      console.error(`Error sending email: ${error.message}`);
      throw new BadRequestException(`Failed to send email: ${error.message}`);
    }
  };

  sendAdminNotificationEmail = async (registration: IOrganizerRegistration) => {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Event Organizer Registration</h2>
        
        <p>A new event organizer has submitted a registration form.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Organizer Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Company/Organizer:</strong> ${
              registration.organizerName
            }</li>
            <li><strong>Contact Person:</strong> ${
              registration.contactPersonName
            }</li>
            <li><strong>Email:</strong> ${registration.emailAddress}</li>
            <li><strong>Phone:</strong> ${registration.mobileNumber}</li>
            ${
              registration.website
                ? `<li><strong>Website:</strong> ${registration.website}</li>`
                : ""
            }
          </ul>
        </div>
        
        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Event Name:</strong> ${registration.eventName}</li>
            <li><strong>Event Type:</strong> ${registration.eventType}</li>
            <li><strong>Date & Time:</strong> ${new Date(
              registration.eventDate
            ).toLocaleDateString()} at ${registration.eventTime}</li>
            <li><strong>Venue:</strong> ${registration.venueName}</li>
            <li><strong>Address:</strong> ${registration.venueAddress}</li>
            <li><strong>City:</strong> ${registration.city}</li>
            <li><strong>Expected Audience:</strong> ${
              registration.expectedAudienceSize
            }</li>
          </ul>
        </div>
        
        ${
          registration.preferredContactDate || registration.preferredContactTime
            ? `
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Contact Preferences:</h3>
          <ul style="list-style: none; padding: 0;">
            ${
              registration.preferredContactDate
                ? `<li><strong>Preferred Date:</strong> ${new Date(
                    registration.preferredContactDate
                  ).toLocaleDateString()}</li>`
                : ""
            }
            ${
              registration.preferredContactTime
                ? `<li><strong>Preferred Time:</strong> ${registration.preferredContactTime}</li>`
                : ""
            }
          </ul>
        </div>
        `
            : ""
        }
        
        <p style="margin-top: 30px;">
          <strong>Next Steps:</strong> Please assign this registration to a team member and contact the organizer within 24 hours.
        </p>
        
        <p>
          <a href="${process.env.ADMIN_URL}/organizer-registrations/${
      registration._id
    }" 
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View in Admin Panel
          </a>
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL || "admin@pravesh.events",
      subject: `New Registration: ${registration.eventName} by ${registration.organizerName}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
  };

  sendStatusUpdateEmail = async (
    registration: IOrganizerRegistration,
    status: string
  ) => {
    let statusMessage = "";
    let statusColor = "#333";

    switch (status) {
      case "contacted":
        statusMessage =
          "Our team has been in touch and is reviewing your event details.";
        statusColor = "#ffc107";
        break;
      case "in_progress":
        statusMessage =
          "Your event is being set up on our platform. We'll notify you once it's live.";
        statusColor = "#17a2b8";
        break;
      case "completed":
        statusMessage =
          "Your event has been successfully listed on Pravesh Events! You can now start selling tickets.";
        statusColor = "#28a745";
        break;
      case "rejected":
        statusMessage =
          "Unfortunately, we cannot proceed with your event listing at this time. Our team will contact you with more details.";
        statusColor = "#dc3545";
        break;
      default:
        return; // Don't send email for pending status
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColor};">Event Registration Update - ${
      registration.eventName
    }</h2>
        
        <p>Dear ${registration.contactPersonName},</p>
        
        <p>We have an update regarding your event registration for "<strong>${
          registration.eventName
        }</strong>".</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
          <h3 style="margin-top: 0; color: ${statusColor};">Status: ${status
      .toUpperCase()
      .replace("_", " ")}</h3>
          <p style="margin-bottom: 0;">${statusMessage}</p>
        </div>
        
        ${
          registration.notes
            ? `
        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Additional Notes:</h3>
          <p style="margin-bottom: 0;">${registration.notes}</p>
        </div>
        `
            : ""
        }
        
        <p>If you have any questions, please don't hesitate to contact us:</p>
        <ul>
          <li><strong>Email:</strong> info@pravesh.events</li>
          <li><strong>Phone:</strong> +91 9023658437</li>
        </ul>
        
        <p>Thank you for choosing Pravesh Events!</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: registration.emailAddress,
      subject: `Update: ${registration.eventName} - ${status
        .replace("_", " ")
        .toUpperCase()}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
  };

  sendConfirmationEmail = async (registration: IOrganizerRegistration) => {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Registration Received - Pravesh Events</h2>
        
        <p>Dear ${registration.contactPersonName},</p>
        
        <p>Thank you for your interest in listing your event "<strong>${
          registration.eventName
        }</strong>" on Pravesh Events platform.</p>
        
        <p>We have received your registration details and our team will review your submission. You can expect to hear from us within 24 hours.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Event Details Summary:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Event Name:</strong> ${registration.eventName}</li>
            <li><strong>Event Type:</strong> ${registration.eventType}</li>
            <li><strong>Date:</strong> ${new Date(
              registration.eventDate
            ).toLocaleDateString()}</li>
            <li><strong>Venue:</strong> ${registration.venueName}, ${
      registration.city
    }</li>
            <li><strong>Expected Audience:</strong> ${
              registration.expectedAudienceSize
            }</li>
          </ul>
        </div>
        
        <p>In the meantime, if you have any questions, please don't hesitate to contact us:</p>
        <ul>
          <li><strong>Email:</strong> info@pravesh.events</li>
          <li><strong>Phone:</strong> +91 9023658437</li>
          <li><strong>Website:</strong> www.pravesh.events</li>
        </ul>
        
        <p>Thank you for choosing Pravesh Events!</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This is an automated email. Please do not reply to this email address.
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: registration.emailAddress,
      subject: `Registration Received - ${registration.eventName}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
  };

  sendContributorVerificationEmail = async (
    email: string,
    event: any,
    verificationToken: string
  ) => {
    const verificationLink = `${process.env.ADMIN_FRONTEND_URL}/contributor/verify?token=${verificationToken}&email=${email}`;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; font-size: 28px; margin: 0 0 10px 0; font-weight: 700;">
              Welcome to ${event.name}
            </h1>
            <h2 style="color: #667eea; font-size: 20px; margin: 0; font-weight: 600;">
              Contributor Access
            </h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-size: 16px; color: #2c3e50; line-height: 1.6;">
              You have been added as a contributor for the event: <strong>${event.name}</strong>
            </p>
          </div>
          
          <p style="font-size: 16px; color: #5a6c7d; line-height: 1.6; margin: 20px 0;">
            Please click the button below to verify your email and activate your contributor access:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            ">
              ✉️ Verify Email
            </a>
          </div>
          
          <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #2c3e50; font-weight: 600;">
              If the button doesn't work, copy and paste this link:
            </p>
            <p style="margin: 0; font-size: 14px; color: #667eea; word-break: break-all;">
              ${verificationLink}
            </p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 14px; color: #856404; font-weight: 600;">
              📋 Next Steps:
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404; line-height: 1.5;">
              After verification, you can use your email along with the event password to login as a contributor and access the event management features.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              This email was sent by Pravesh Events. If you have any questions, please contact the event administrator.
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `🎉 Contributor Access - ${event.name}`,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
  };
}

export const EmailService = new emailService();
