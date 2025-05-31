import { useState } from "react";

interface ContactForm {
  email: string;
  phone: string;
}

export default function TestValidation() {
  const [formData, setFormData] = useState<ContactForm>({
    email: "",
    phone: ""
  });

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

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Validation Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="test@gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Value: "{formData.email}"</p>
            {formData.email && (
              validateEmail(formData.email) ? (
                <p className="text-green-600 text-sm">✓ Valid email</p>
              ) : (
                <p className="text-red-500 text-sm">✗ Invalid email or domain not allowed</p>
              )
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">Value: "{formData.phone}"</p>
            {formData.phone && (
              validatePhone(formData.phone) ? (
                <p className="text-green-600 text-sm">✓ Valid phone</p>
              ) : (
                <p className="text-red-500 text-sm">✗ Phone must be 10 digits</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}