import React, { useState } from 'react';

export default function HailSimple() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    console.log('Email changed:', value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    console.log('Phone changed:', value);
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '50px auto', 
      padding: '30px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: '30px', color: '#10b981' }}>
        Get Your Free Hail Damage Estimate
      </h1>

      <div style={{ marginBottom: '25px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold' 
        }}>
          Email Address:
        </label>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="test@gmail.com"
          style={{
            width: '100%',
            padding: '12px',
            border: `3px solid ${
              !email ? '#ccc' : 
              validateEmail(email) ? '#28a745' : '#dc3545'
            }`,
            borderRadius: '4px',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ 
          marginTop: '8px', 
          fontSize: '14px',
          color: '#666'
        }}>
          Current value: "{email}"
        </div>
        {email && (
          <div style={{
            marginTop: '5px',
            fontSize: '14px',
            color: validateEmail(email) ? '#28a745' : '#dc3545',
            fontWeight: 'bold'
          }}>
            {validateEmail(email) ? '✓ Valid email address' : '✗ Invalid email or domain not allowed'}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold' 
        }}>
          Phone Number:
        </label>
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="1234567890"
          style={{
            width: '100%',
            padding: '12px',
            border: `3px solid ${
              !phone ? '#ccc' : 
              validatePhone(phone) ? '#28a745' : '#dc3545'
            }`,
            borderRadius: '4px',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ 
          marginTop: '8px', 
          fontSize: '14px',
          color: '#666'
        }}>
          Current value: "{phone}"
        </div>
        {phone && (
          <div style={{
            marginTop: '5px',
            fontSize: '14px',
            color: validatePhone(phone) ? '#28a745' : '#dc3545',
            fontWeight: 'bold'
          }}>
            {validatePhone(phone) ? '✓ Valid 10-digit phone number' : '✗ Must be exactly 10 digits'}
          </div>
        )}
      </div>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Debug Information:</h3>
        <div>Email state: {JSON.stringify(email)}</div>
        <div>Phone state: {JSON.stringify(phone)}</div>
        <div>Email valid: {validateEmail(email).toString()}</div>
        <div>Phone valid: {validatePhone(phone).toString()}</div>
      </div>
    </div>
  );
}