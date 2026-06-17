import { MailService } from '@sendgrid/mail';
import { ContactRequest } from '../shared/schema';

// SendGrid requires the "from" to be a VERIFIED sender. The account verified admin@oksigma.com (not aescalante@). Override via SENDGRID_FROM_EMAIL.
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "admin@oksigma.com";

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
          email: FROM_EMAIL,
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

  // Lightweight quote-funnel lead (the /estimate "Lock in 5%" + "Got a question?" CTAs). No DB — just notify Antonio's inbox.
  async sendQuoteLead(d: { ctaType: string; code: string; address: string; estimate?: string; firstName?: string; phone?: string; email?: string; question?: string; preference?: string }): Promise<boolean> {
    try {
      const lockIn = d.ctaType === "lock-in";
      const subject = `${lockIn ? "🔒 LOCK-IN 5%" : "❓ Quote question"}${d.firstName ? ` · ${d.firstName}` : ""} · ${d.code} · ${d.address}`;
      const lines = [
        lockIn ? "🔒 LOCK-IN THE 5% ONLINE DISCOUNT" : "❓ QUESTION ABOUT A QUOTE",
        d.firstName ? `Name:       ${d.firstName}` : "",
        `Quote code: ${d.code}`,
        `Address:    ${d.address}`,
        d.estimate ? `Estimate:   ${d.estimate}` : "",
        d.preference ? `Preference: ${d.preference}` : "",
        d.phone ? `Phone:      ${d.phone}` : "",
        d.email ? `Email:      ${d.email}` : "",
        d.question ? `Question:   ${d.question}` : "",
        `Submitted:  ${new Date().toLocaleString()}`,
      ].filter(Boolean);
      const text = lines.join("\n");
      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:${lockIn ? "#047857" : "#b45309"}">${lockIn ? "🔒 Lock-in 5% discount" : "❓ Quote question"}</h2>
        <pre style="background:#f9fafb;border:1px solid #e5e7eb;padding:14px;border-radius:8px;font-size:14px;white-space:pre-wrap">${text}</pre>
        ${d.phone ? `<a href="tel:${d.phone}" style="background:#047857;color:#fff;padding:11px 20px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">📞 Call ${d.phone}</a>` : ""}
        ${d.email ? ` <a href="mailto:${d.email}" style="color:#047857;font-weight:bold;margin-left:10px">✉️ ${d.email}</a>` : ""}
      </div>`;
      await this.mailService.send({
        to: [this.config.notificationEmail],
        from: { email: FROM_EMAIL, name: "Sigma Roofing Quotes" },
        subject, text, html,
      });
      console.log(`✅ Quote-lead email sent — ${d.ctaType} ${d.code} ${d.address}`);
      return true;
    } catch (error) {
      console.error("❌ Quote-lead email failed:", error);
      return false;
    }
  }

  // Branded confirmation sent TO the customer (only when they gave an email). No name used — "Hi, nice to meet you!".
  async sendCustomerConfirmation(d: { code: string; address: string; estimate?: string; email: string; ctaType: string }): Promise<boolean> {
    try {
      const next = d.ctaType === "lock-in" ? "lock it in" : "answer your question";
      const subject = `Sigma Roofing — we got your request (code ${d.code})`;
      const text = [
        "Hi, nice to meet you!",
        "",
        `Thanks for grabbing an instant roof estimate on ${d.address}.`,
        d.estimate ? `Your roof: about ${d.estimate} (architectural shingle re-roof).` : "",
        `Your 5%-off code: ${d.code} — mention it when you book and we'll take 5% off.`,
        `An agent will reach out shortly to ${next}. Questions now? Call (405) 902-5266.`,
        "",
        "— Sigma Roofing LLC · Licensed & insured · LIC#80006734",
        "16612 N Western Avenue, Edmond, OK 73012",
      ].filter(Boolean).join("\n");
      const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a2230">
        <div style="background:#13233b;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0"><div style="font-size:20px;font-weight:700">Sigma Roofing LLC</div><div style="font-size:13px;opacity:.8">Instant roof estimate</div></div>
        <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 10px 10px;padding:22px">
          <p style="font-size:17px;margin:0 0 12px">Hi, nice to meet you! 👋</p>
          <p>Thanks for grabbing an instant roof estimate on <b>${d.address}</b>.</p>
          ${d.estimate ? `<p>Your roof: about <b>${d.estimate}</b> (architectural shingle re-roof).</p>` : ""}
          <div style="background:#fef3c7;border:1px solid #f0d089;border-radius:8px;padding:12px 14px;margin:14px 0">
            🔒 Your online discount code: <b style="letter-spacing:1px">${d.code}</b> — mention it when you book and we'll take <b>5% off</b>.
          </div>
          <p>An agent will reach out shortly to ${next}. Questions now? <a href="tel:+14059025266" style="color:#13233b;font-weight:700">(405) 902-5266</a>.</p>
          <hr style="border:0;border-top:1px solid #eee;margin:18px 0">
          <div style="font-size:13px;color:#6b7280">
            <b>Sigma Roofing LLC</b> · Licensed &amp; insured · LIC#80006734<br>
            16612 N Western Avenue, Edmond, OK 73012 · (405) 902-5266
          </div>
        </div>
      </div>`;
      await this.mailService.send({ to: d.email, from: { email: FROM_EMAIL, name: "Sigma Roofing LLC" }, subject, text, html });
      console.log(`✅ Customer confirmation sent → ${d.email} (${d.code})`);
      return true;
    } catch (error) {
      console.error("❌ Customer confirmation failed:", error);
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