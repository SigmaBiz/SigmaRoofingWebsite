import React, { useState } from 'react';

export default function HailSimple() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    const allowedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
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
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px' }}>
      <label>Email:</label>
      <input
        type="email"
        value={email}
        onChange={handleEmailChange}
        style={{
          border: `3px solid ${!email ? '#ccc' : validateEmail(email) ? '#28a745' : '#dc3545'}`,
          padding: '10px',
          marginBottom: '15px',
          width: '100%'
        }}
      />
      <label>Phone:</label>
      <input
        type="tel"
        value={phone}
        onChange={handlePhoneChange}
        style={{
          border: `3px solid ${!phone ? '#ccc' : validatePhone(phone) ? '#28a745' : '#dc3545'}`,
          padding: '10px',
          width: '100%'
        }}
      />
    </div>
  );
}