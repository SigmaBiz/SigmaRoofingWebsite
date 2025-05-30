import React, { useState } from 'react';

export default function HailSimpleForm() {
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
      <h1 style={{ marginBottom: '30px', color: '#10b981', fontSize: '28px' }}>
        Get Your Free Hail Damage Estimate
      </h1>
      <p style={{ marginBottom: '30px', color: '#666', lineHeight: '1.5' }}>
        Professional storm damage assessment in Oklahoma. Fill out our secure form for a detailed estimate within 24 hours.
      </p>

      <div style={{ marginBottom: '25px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold' 
        }}>
          Email Address *
        </label>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="your.email@example.com"
          style={{
            width: '100%',
            padding: '12px',
            border: `3px solid ${
              !email ? '#ccc' : 
              validateEmail(email) ? '#10b981' : '#dc3545'
            }`,
            borderRadius: '4px',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
        {email && (
          <div style={{
            marginTop: '5px',
            fontSize: '14px',
            color: validateEmail(email) ? '#10b981' : '#dc3545',
            fontWeight: 'bold'
          }}>
            {validateEmail(email) ? '✓ Valid email address' : '✗ Please enter a valid email from a recognized provider'}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold' 
        }}>
          Phone Number *
        </label>
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="(555) 555-5555"
          style={{
            width: '100%',
            padding: '12px',
            border: `3px solid ${
              !phone ? '#ccc' : 
              validatePhone(phone) ? '#10b981' : '#dc3545'
            }`,
            borderRadius: '4px',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
        {phone && (
          <div style={{
            marginTop: '5px',
            fontSize: '14px',
            color: validatePhone(phone) ? '#10b981' : '#dc3545',
            fontWeight: 'bold'
          }}>
            {validatePhone(phone) ? '✓ Valid 10-digit phone number' : '✗ Please enter a valid 10-digit US phone number'}
          </div>
        )}
      </div>

      <button
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#059669'}
        onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#10b981'}
      >
        Submit Free Estimate Request
      </button>
    </div>
  );
}