const express = require('express');
const http = require('http');
require('dotenv').config();

const app = express();
app.use(express.json());

// Google Places address suggestions API
app.get('/api/address-suggestions', async (req, res) => {
  try {
    const query = req.query.q;
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey || !query || query.length < 1) {
      // Fallback Oklahoma cities
      const fallbackSuggestions = [
        { formatted_address: "Oklahoma City, OK, USA", place_id: "fallback_okc" },
        { formatted_address: "Edmond, OK, USA", place_id: "fallback_edmond" },
        { formatted_address: "Norman, OK, USA", place_id: "fallback_norman" },
        { formatted_address: "Moore, OK, USA", place_id: "fallback_moore" }
      ].filter(city => 
        city.formatted_address.toLowerCase().includes(query.toLowerCase())
      );
      
      return res.json({ success: true, suggestions: fallbackSuggestions, source: 'fallback' });
    }

    // Google Places API call
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query + ' Oklahoma')}&types=address&components=country:us&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "OK") {
      const suggestions = data.predictions?.slice(0, 5).map(pred => ({
        formatted_address: pred.description,
        place_id: pred.place_id
      })) || [];
      
      res.json({ success: true, suggestions, source: 'google_places' });
    } else {
      throw new Error('Google API error');
    }
    
  } catch (error) {
    console.error('Address API error:', error);
    res.json({ success: true, suggestions: [], source: 'error' });
  }
});

// Contact form API with SendGrid email
app.post('/api/contact', async (req, res) => {
  console.log('📝 Contact form submission:', req.body);
  
  // Send email notification if SendGrid is configured
  if (process.env.SENDGRID_API_KEY && process.env.NOTIFICATION_EMAIL) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to: process.env.NOTIFICATION_EMAIL,
        from: 'aescalante@oksigma.com',
        subject: `🏠 New MVP3 Lead: ${req.body.firstName} ${req.body.lastName} - ${req.body.serviceType}`,
        text: `New lead from MVP3 Contact Form:\n\nName: ${req.body.firstName} ${req.body.lastName}\nEmail: ${req.body.email}\nPhone: ${req.body.phone}\nAddress: ${req.body.address}\nService: ${req.body.serviceType}\n\nCall immediately to schedule consultation!`,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>🏠 New MVP3 Lead</h2>
            <p><strong>Name:</strong> ${req.body.firstName} ${req.body.lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${req.body.email}">${req.body.email}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${req.body.phone}">${req.body.phone}</a></p>
            <p><strong>Address:</strong> ${req.body.address}</p>
            <p><strong>Service:</strong> ${req.body.serviceType}</p>
            <hr>
            <p><em>Call immediately to schedule their roofing consultation!</em></p>
          </div>
        `
      };
      
      await sgMail.send(msg);
      console.log('✅ Email notification sent to:', process.env.NOTIFICATION_EMAIL);
    } catch (error) {
      console.error('❌ SendGrid error:', error);
    }
  }
  
  res.json({ 
    success: true, 
    message: 'Thank you for your inquiry! We will contact you within 24 hours.' 
  });
});

// Serve the contact form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sigma Roofing - MVP3 Test</title>
      <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet">
      <script src="https://assets.calendly.com/assets/external/widget.js" type="text/javascript" async></script>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; line-height: 1.6; }
        .form-group { margin: 15px 0; }
        input, select { width: 100%; padding: 12px; margin: 5px 0; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
        button { background: #10b981; color: white; padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: bold; width: 100%; }
        button:hover { background: #059669; }
        .header { background: linear-gradient(135deg, #10b981, #047857); color: white; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏠 Sigma Roofing LLC - MVP3</h1>
        <p>Professional Roofing Services in Oklahoma</p>
      </div>
      
      <h2>Get Your Free Estimate</h2>
      <p>Fill out our streamlined form and we'll contact you within 24 hours to schedule your consultation.</p>
      
      <form id="contactForm">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div class="form-group" style="margin: 0;">
            <input type="text" name="firstName" placeholder="First Name*" required>
          </div>
          <div class="form-group" style="margin: 0;">
            <input type="text" name="lastName" placeholder="Last Name*" required>
          </div>
        </div>
        <div class="form-group">
          <input type="email" name="email" placeholder="Email Address*" required>
        </div>
        <div class="form-group">
          <input type="tel" name="phone" placeholder="Phone Number (e.g., 405-555-0123)*" required>
        </div>
        <div class="form-group" style="position: relative;">
          <input type="text" name="address" id="address-input" placeholder="Property Address (Oklahoma)*" required>
          <div id="address-suggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; max-height: 200px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
        </div>
        <div class="form-group">
          <select name="serviceType" required>
            <option value="">Select Service Type*</option>
            <option value="roof-repair">Roof Repair</option>
            <option value="storm-damage">Storm Damage Assessment</option>
            <option value="emergency-repair">Emergency Repair</option>
            <option value="roof-replacement">Roof Replacement</option>
            <option value="inspection">Roof Inspection</option>
          </select>
        </div>
        <button type="submit">Submit Free Estimate Request</button>
      </form>
      
      <div id="message" style="margin-top: 20px; padding: 15px; border-radius: 8px; display: none;"></div>
      
      <script>
        // Address autocomplete functionality
        let addressTimeout;
        async function searchAddresses(query) {
          if (query.length < 1) {
            document.getElementById('address-suggestions').style.display = 'none';
            return;
          }

          clearTimeout(addressTimeout);
          addressTimeout = setTimeout(async () => {
            try {
              const response = await fetch('/api/address-suggestions?q=' + encodeURIComponent(query));
              const data = await response.json();
              
              console.log('Address API response:', data);
              
              if (data.success && data.suggestions && data.suggestions.length > 0) {
                const suggestionsDiv = document.getElementById('address-suggestions');
                suggestionsDiv.innerHTML = data.suggestions.map((suggestion, index) => 
                  '<div style="padding: 12px; cursor: pointer; border-bottom: 1px solid #f3f4f6;" onclick="selectAddress(' + index + ')">' + 
                  suggestion.formatted_address + '</div>'
                ).join('');
                suggestionsDiv.style.display = 'block';
                
                // Store suggestions for selection
                window.currentSuggestions = data.suggestions;
                
                // Show source indicator
                const sourceText = data.source === 'google_places' ? '✅ Google Places' : '⚠️ Fallback';
                console.log('Address suggestions source:', sourceText);
              } else {
                console.log('No suggestions found');
                document.getElementById('address-suggestions').style.display = 'none';
              }
            } catch (error) {
              console.error('Address search error:', error);
              document.getElementById('address-suggestions').style.display = 'none';
            }
          }, 200);
        }

        function selectAddress(index) {
          if (window.currentSuggestions && window.currentSuggestions[index]) {
            document.getElementById('address-input').value = window.currentSuggestions[index].formatted_address;
            document.getElementById('address-suggestions').style.display = 'none';
          }
        }

        // Add event listeners
        document.getElementById('address-input').addEventListener('input', function(e) {
          searchAddresses(e.target.value);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.form-group')) {
            document.getElementById('address-suggestions').style.display = 'none';
          }
        });

        document.getElementById('contactForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(e.target);
          const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            serviceType: formData.get('serviceType')
          };
          
          // Simple validation
          if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.address || !data.serviceType) {
            alert('Please fill in all required fields.');
            return;
          }
          
          const messageDiv = document.getElementById('message');
          
          try {
            const response = await fetch('/api/contact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
              messageDiv.style.display = 'block';
              messageDiv.style.background = '#d1fae5';
              messageDiv.style.color = '#065f46';
              messageDiv.style.border = '2px solid #10b981';
              messageDiv.innerHTML = '✅ ' + result.message;
              // Store form data for Calendly
              const savedData = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                address: data.address,
                serviceType: data.serviceType
              };
              
              e.target.reset();
              
              // Open Calendly popup after successful submission
              setTimeout(() => {
                if (window.Calendly) {
                  Calendly.initPopupWidget({
                    url: 'https://calendly.com/aescalante-oksigma/new-meeting',
                    text: 'Schedule your roofing consultation',
                    prefill: {
                      name: savedData.firstName + ' ' + savedData.lastName,
                      email: savedData.email,
                      customAnswers: {
                        a1: 'Phone: ' + savedData.phone + ' | Service: ' + savedData.serviceType + ' | Address: ' + savedData.address
                      }
                    }
                  });
                } else {
                  // Fallback if Calendly hasn't loaded
                  alert('Opening Calendly for appointment scheduling...');
                  window.open('https://calendly.com/aescalante-oksigma/new-meeting', '_blank');
                }
              }, 1500);
            } else {
              throw new Error(result.message || 'Submission failed');
            }
          } catch (error) {
            messageDiv.style.display = 'block';
            messageDiv.style.background = '#fee2e2';
            messageDiv.style.color = '#991b1b';
            messageDiv.style.border = '2px solid #ef4444';
            messageDiv.innerHTML = '❌ Error: ' + error.message;
          }
        });
      </script>
    </body>
    </html>
  `);
});

const server = http.createServer(app);
const port = 4000;

server.listen(port, '127.0.0.1', () => {
  console.log('✅ Minimal MVP3 server running on http://localhost:4000');
  console.log('🎯 Test the contact form to verify basic functionality');
});