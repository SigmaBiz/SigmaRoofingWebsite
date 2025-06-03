# Calendly Integration Setup

## Quick Setup Guide

1. **Replace the Calendly URL** in `/client/src/components/contact-with-calendly.tsx`:
   - Find line ~450 where it says: `data-url="https://calendly.com/your-username/roofing-estimate?hide_gdpr_banner=1&primary_color=10b981"`
   - Replace `your-username` with your actual Calendly username
   - Replace `roofing-estimate` with your actual event type slug (if different)

2. **Optional Customizations**:
   - `primary_color=10b981` - This is set to match your emerald theme
   - `hide_gdpr_banner=1` - Hides the GDPR banner (since you handle privacy in your form)
   - Height is set to 650px to show a full week view

## How It Works

The integration:
- Embeds Calendly inline (no popups) for better user experience
- Listens for when appointments are scheduled
- Shows a confirmation message when booking is complete
- Stores the appointment info with the form submission
- Users can still submit the form even without scheduling

## Testing Locally

1. Replace the component import in your main app:
   ```tsx
   import ContactWithCalendly from '@/components/contact-with-calendly';
   ```

2. The form will:
   - Validate all fields in real-time
   - Show the Calendly widget inline
   - Track when appointments are scheduled
   - Submit everything together

## Benefits for Users

- No popup confusion
- Stays in the same flow
- Clear visual feedback
- Works for all ages/abilities
- Mobile-friendly