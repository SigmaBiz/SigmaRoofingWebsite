import React, { useState } from "react";

export default function HailSimple() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1]?.toLowerCase();
    const allowedDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'icloud.com', 'protonmail.com', 'live.com', 'msn.com', 'comcast.net',
      'verizon.net', 'sbcglobal.net', 'att.net', 'cox.net', 'charter.net'
    ];
    
    return allowedDomains.includes(domain);
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 10;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h1>Hail Damage Form - Simple Test</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="test@gmail.com"
          style={{
            width: "100%",
            padding: "10px",
            border: `2px solid ${!email ? '#ccc' : validateEmail(email) ? 'green' : 'red'}`,
            borderRadius: "4px"
          }}
        />
        <div>Value: "{email}"</div>
        {email && (
          <div style={{ color: validateEmail(email) ? 'green' : 'red' }}>
            {validateEmail(email) ? '✓ Valid email' : '✗ Invalid email'}
          </div>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label>Phone:</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="1234567890"
          style={{
            width: "100%",
            padding: "10px",
            border: `2px solid ${!phone ? '#ccc' : validatePhone(phone) ? 'green' : 'red'}`,
            borderRadius: "4px"
          }}
        />
        <div>Value: "{phone}"</div>
        {phone && (
          <div style={{ color: validatePhone(phone) ? 'green' : 'red' }}>
            {validatePhone(phone) ? '✓ Valid phone' : '✗ Phone must be 10 digits'}
          </div>
        )}
      </div>
    </div>
  );
}