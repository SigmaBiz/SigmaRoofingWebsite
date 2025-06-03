import { MailService } from '@sendgrid/mail';
import { ContactRequest } from '../shared/schema';

interface EmailServiceConfig {
  sendGridApiKey: string;
  notificationEmail: string;
}

class EmailService {
  private mailService: MailService;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.mailService = new MailService();
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    try {
      console.log('Initializing SendGrid email service...');
      this.mailService.setApiKey(this.config.sendGridApiKey);
      console.log('SendGrid initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SendGrid:', error);
    }
  }

  async sendLeadNotification(lead: ContactRequest): Promise<boolean> {
    try {
      const subject = `🏠 New MVP3 Lead: ${lead.serviceType} - ${lead.phone}`;
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #047857); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🏠 New Lead - MVP3 Streamlined Form</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Sigma Roofing LLC - Lead Notification</p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #047857; margin-top: 0;">Quick Contact Information</h2>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 120px;">📞 Phone:</td>
                  <td style="padding: 8px 0; color: #111827;"><a href="tel:${lead.phone}" style="color: #10b981; text-decoration: none; font-size: 18px; font-weight: bold;">${lead.phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">📍 Address:</td>
                  <td style="padding: 8px 0; color: #111827;">${lead.address}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">🔧 Service:</td>
                  <td style="padding: 8px 0; color: #111827;"><span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${lead.serviceType.toUpperCase()}</span></td>
                </tr>
                ${lead.schedulingUrl ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #374151;">📅 Appointment:</td>
                  <td style="padding: 8px 0; color: #111827;"><a href="${lead.schedulingUrl}" style="color: #10b981; text-decoration: none;">Calendly Scheduled ✓</a></td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="background: #10b981; color: white; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 15px;">
              <h3 style="margin: 0 0 10px 0;">🎯 Call Immediately - Hot Lead!</h3>
              <p style="margin: 0 0 15px 0; opacity: 0.9;">Customer provided contact info and may schedule appointment</p>
              <a href="tel:${lead.phone}" style="background: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">📞 CALL NOW: ${lead.phone}</a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <h4 style="margin: 0 0 8px 0; color: #92400e;">💡 MVP3 Streamlined Process</h4>
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                This lead used our simplified 3-field form. Name and email will be collected during Calendly scheduling if they book an appointment.
              </p>
            </div>
            
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px; text-align: center;">
              Submitted: ${new Date(lead.createdAt).toLocaleString()}<br>
              Lead ID: #${lead.id} | MVP3 System
            </p>
          </div>
        </div>
      `;

      const textBody = `
🏠 NEW MVP3 LEAD - CALL IMMEDIATELY!

Phone: ${lead.phone}
Address: ${lead.address}
Service: ${lead.serviceType}
${lead.schedulingUrl ? `Appointment: ${lead.schedulingUrl}` : 'No appointment scheduled yet'}

Submitted: ${new Date(lead.createdAt).toLocaleString()}
Lead ID: #${lead.id}

This customer used our streamlined form. Call them now to schedule their estimate!
      `;

      // Send email using SendGrid with verified sender - multiple recipients
      const recipients = [
        this.config.notificationEmail,
        // Add more email addresses here as needed
      ];
      
      await this.mailService.send({
        to: recipients,
        from: {
          email: 'aescalante@oksigma.com',
          name: 'Sigma Roofing Leads'
        },
        subject: subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`✅ MVP3 lead notification email sent successfully - ${lead.serviceType} at ${lead.address}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send lead notification email:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }
  }
}

// Create and export the email service instance
const emailService = new EmailService({
  sendGridApiKey: process.env.SENDGRID_API_KEY || '',
  notificationEmail: process.env.NOTIFICATION_EMAIL || '',
});

export { emailService };