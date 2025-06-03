# MVP3 Setup Guide - Full API Integration

## 🎯 MVP3 Features
- **Google Places API**: Real address autocomplete with street-level precision
- **SendGrid Email**: Instant lead notifications with professional templates
- **Enhanced UX**: Streamlined 3-field form with intelligent fallbacks
- **Production Ready**: Robust error handling and graceful degradation

## 🔧 Required API Keys

### 1. Google Places API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable these APIs:
   - **Places API (New)**
   - **Geocoding API**
4. Create credentials → API Key
5. Restrict the API key:
   - **Application restrictions**: HTTP referrers
   - **API restrictions**: Places API, Geocoding API

### 2. SendGrid Email Setup
1. Go to [SendGrid](https://app.sendgrid.com/settings/api_keys)
2. Create account or sign in
3. Create new API key with "Full Access"
4. Verify sender email address in SendGrid

## 📝 Environment Configuration

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
# Google Places API
GOOGLE_API_KEY=AIza...your_actual_google_key

# SendGrid Email
SENDGRID_API_KEY=SG....your_actual_sendgrid_key

# Email notifications
NOTIFICATION_EMAIL=your_email@domain.com
```

## 🚀 Testing MVP3

### 1. Start the server:
```bash
npm run dev
```

### 2. Test address autocomplete:
- Go to `http://localhost:5173`
- Type in address field: "123 main"
- Should see real Oklahoma addresses (with Google API) or fallback cities

### 3. Test form submission:
```bash
curl -X POST http://localhost:5173/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "(405) 555-0123",
    "address": "123 Main St, Oklahoma City, OK",
    "serviceType": "roof-repair"
  }'
```

### 4. Check email notifications:
- Form submission should trigger email to `NOTIFICATION_EMAIL`
- Check spam folder if not received immediately

## 🔍 Troubleshooting

### No address suggestions:
- Check Google API key in `.env`
- Verify Places API is enabled
- Look for console logs: "✅ Using Google Places API" vs "⚠️ Using fallback suggestions"

### No email notifications:
- Check SendGrid API key format: starts with "SG."
- Verify sender email is verified in SendGrid
- Check server logs for email errors

### Server not starting:
- Ensure port 5173 is available: `lsof -i :5173`
- Check for API key format issues in logs

## 📊 API Status Indicators

The system provides clear feedback:
- **Google Places**: Console shows "✅ Using Google Places API" 
- **Fallback Mode**: Console shows "⚠️ Using fallback suggestions"
- **Email Success**: Server logs "✅ MVP3 lead notification email sent"
- **Email Failure**: Server logs "❌ Failed to send lead notification email"

## 🎖️ MVP3 Success Criteria

✅ **Google Places working**: Real addresses appear in autocomplete  
✅ **Email notifications working**: Immediate email on form submission  
✅ **Form validation**: Phone and address validation active  
✅ **Calendly integration**: Popup opens after form submission  
✅ **Graceful fallbacks**: Works even without API keys  

## 🔄 Fallback Behavior

MVP3 is designed to work even with missing API keys:
- **No Google API**: Shows Oklahoma cities as fallback suggestions
- **No SendGrid API**: Form still submits, just no email notifications
- **Graceful degradation**: User experience remains smooth

Your roofing business gets high-quality leads even during API outages! 🏠