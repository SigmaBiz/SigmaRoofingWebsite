import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { ContactRequest } from '../shared/schema';

interface EmailServiceConfig {
  serviceAccountKey: string;
  notificationEmail: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      const serviceAccount = JSON.parse(this.config.serviceAccountKey);
      
      const oauth2Client = new google.auth.JWT(
        serviceAccount.client_email,
        undefined,
        serviceAccount.private_key,
        ['https://www.googleapis.com/auth/gmail.send']
      );

      const accessToken = await oauth2Client.getAccessToken();

      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          type: 'OAuth2',
          user: serviceAccount.client_email,
          clientId: serviceAccount.client_id,
          clientSecret: serviceAccount.client_secret,
          refreshToken: undefined,
          accessToken: accessToken.token,
        },
      });

      console.log('Gmail transporter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Gmail transporter:', error);
    }
  }

  async sendLeadNotification(lead: ContactRequest): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized');
      return false;
    }

    try {
      const subject = `🏠 New Roofing Lead: ${lead.firstName} ${lead.lastName} - ${lead.serviceType}`;
      
      const formatTimeSlot = (time: string) => {
        const hour = parseInt(time.split(':')[0]);
        const startTime = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
        const endHour = hour + 4;
        const endTime = endHour <= 12 ? `${endHour}:00 AM` : `${endHour - 12}:00 PM`;
        return `${startTime} - ${endTime}`;
      };
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #047857); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🏠 New Estimate Request</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Sigma Roofing LLC - Lead Notification</p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #047857; margin-top: 0;">Customer Information</h2>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #111827;">${lead.firstName} ${lead.lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Phone:</td>
                  <td style="padding: 8px 0; color: #111827;"><a href="tel:${lead.phone}" style="color: #10b981; text-decoration: none;">${lead.phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                  <td style="padding: 8px 0; color: #111827;"><a href="mailto:${lead.email}" style="color: #10b981; text-decoration: none;">${lead.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Address:</td>
                  <td style="padding: 8px 0; color: #111827;">${lead.address}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">Service:</td>
                  <td style="padding: 8px 0; color: #111827;">${lead.serviceType}</td>
                </tr>
              </table>
            </div>

            <h3 style="color: #047857; margin-bottom: 10px;">📅 Preferred Appointment Times</h3>
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <div style="margin-bottom: 15px;">
                <strong style="color: #374151;">First Choice:</strong><br>
                <span style="color: #10b981; font-weight: bold;">${new Date(lead.preferredDate1).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span><br>
                <span style="color: #111827;">${formatTimeSlot(lead.preferredTime1)}</span>
              </div>
              <div>
                <strong style="color: #374151;">Second Choice:</strong><br>
                <span style="color: #10b981; font-weight: bold;">${new Date(lead.preferredDate2).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span><br>
                <span style="color: #111827;">${formatTimeSlot(lead.preferredTime2)}</span>
              </div>
            </div>
            
            ${lead.description ? `
            <h3 style="color: #047857; margin-bottom: 10px;">Project Details</h3>
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <p style="margin: 0; color: #374151; line-height: 1.5;">${lead.description}</p>
            </div>
            ` : ''}
            
            <div style="background: #10b981; color: white; padding: 15px; border-radius: 6px; text-align: center;">
              <h3 style="margin: 0 0 10px 0;">Quick Actions</h3>
              <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <a href="tel:${lead.phone}" style="background: #047857; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">📞 Call Now</a>
                <a href="mailto:${lead.email}" style="background: #047857; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">✉️ Email</a>
              </div>
            </div>
            
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px; text-align: center;">
              Submitted: ${new Date(lead.createdAt).toLocaleString()}<br>
              Lead ID: #${lead.id}
            </p>
          </div>
        </div>
      `;

      const textBody = `
New Roofing Estimate Request - Sigma Roofing LLC

Customer Information:
- Name: ${lead.firstName} ${lead.lastName}
- Phone: ${lead.phone}
- Email: ${lead.email}
- Service Type: ${lead.serviceType}

${lead.description ? `Project Details:\n${lead.description}\n` : ''}

Submitted: ${new Date(lead.createdAt).toLocaleString()}
Lead ID: #${lead.id}

Contact them immediately to schedule their estimate!
      `;

      await this.transporter.sendMail({
        from: `"Sigma Roofing Leads" <${JSON.parse(this.config.serviceAccountKey).client_email}>`,
        to: this.config.notificationEmail,
        subject: subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`Lead notification email sent successfully for: ${lead.firstName} ${lead.lastName}`);
      return true;
    } catch (error) {
      console.error('Failed to send lead notification email:', error);
      return false;
    }
  }
}

// Create and export the email service instance
const emailService = new EmailService({
  serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
  notificationEmail: process.env.NOTIFICATION_EMAIL || '',
});

export { emailService };