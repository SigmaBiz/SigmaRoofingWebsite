import express from 'express';
import { createServer } from 'http';
import 'dotenv/config';

// Import our routes
import { registerRoutes } from './server/routes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add basic logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Register our API routes
await registerRoutes(app);

// Simple test route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sigma Roofing - MVP3 Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .form-group { margin: 15px 0; }
        input, select { width: 100%; padding: 10px; margin: 5px 0; }
        button { background: #10b981; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>🏠 Sigma Roofing - MVP3 Contact Form</h1>
      <form id="contactForm">
        <div class="form-group">
          <input type="tel" name="phone" placeholder="Phone Number*" required>
        </div>
        <div class="form-group">
          <input type="text" name="address" placeholder="Property Address (Oklahoma)*" required>
        </div>
        <div class="form-group">
          <select name="serviceType" required>
            <option value="">Select Service Type*</option>
            <option value="roof-repair">Roof Repair</option>
            <option value="storm-damage">Storm Damage Assessment</option>
            <option value="emergency-repair">Emergency Repair</option>
          </select>
        </div>
        <button type="submit">Submit Request</button>
      </form>
      
      <script>
        document.getElementById('contactForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const data = {
            phone: formData.get('phone'),
            address: formData.get('address'),
            serviceType: formData.get('serviceType')
          };
          
          try {
            const response = await fetch('/api/contact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            if (response.ok) {
              alert('Request submitted successfully!');
              e.target.reset();
            } else {
              alert('Error submitting request');
            }
          } catch (error) {
            alert('Error: ' + error.message);
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Create server
const server = createServer(app);
const port = 4000;

server.listen(port, '127.0.0.1', () => {
  console.log(`✅ Simplified server running on http://localhost:${port}`);
});