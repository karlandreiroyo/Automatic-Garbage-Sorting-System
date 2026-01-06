import React, { useState, useRef, useEffect } from 'react';
import '../employee/employeecss/Profile.css';

// --- ICONS ---
const ShieldIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const PencilIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const SaveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const AlertIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({ 
    fullName: 'John Doe', 
    email: 'john.doe@mail.com', 
    phone: '9123456789' 
  });
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false
  });

  // Validation functions
  const validateFullName = (name) => {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return 'Name can only contain letters and spaces';
    }
    const nameParts = name.trim().split(' ').filter(part => part.length > 0);
    if (nameParts.length < 2) {
      return 'Please enter both first and last name';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) {
      return 'Phone number is required';
    }
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    if (digitsOnly.length > 15) {
      return 'Phone number is too long';
    }
    if (!/^[0-9+\s()-]+$/.test(phone)) {
      return 'Phone number contains invalid characters';
    }
    return '';
  };

  // Handle input change with validation
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Validate on change if field has been touched
    if (touched[field]) {
      let error = '';
      switch (field) {
        case 'fullName':
          error = validateFullName(value);
          break;
        case 'email':
          error = validateEmail(value);
          break;
        case 'phone':
          error = validatePhone(value);
          break;
        default:
          break;
      }
      setErrors({ ...errors, [field]: error });
    }
  };

  // Handle input blur
  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    
    let error = '';
    switch (field) {
      case 'fullName':
        error = validateFullName(formData[field]);
        break;
      case 'email':
        error = validateEmail(formData[field]);
        break;
      case 'phone':
        error = validatePhone(formData[field]);
        break;
      default:
        break;
    }
    setErrors({ ...errors, [field]: error });
  };

  // Validate all fields
  const validateAllFields = () => {
    const newErrors = {
      fullName: validateFullName(formData.fullName),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone)
    };
    
    setErrors(newErrors);
    setTouched({
      fullName: true,
      email: true,
      phone: true
    });
    
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Fetch profile (simulate with useEffect)
  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Your Supabase fetch logic here
      // Simulated data for demo
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Save
  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // Validate all fields before saving
    if (!validateAllFields()) {
      return;
    }

    try {
      // Your Supabase save logic here
      // Split name: first word is first_name, rest is last_name
      const nameParts = formData.fullName.trim().split(' ');
      const fName = nameParts[0];
      const lName = nameParts.slice(1).join(' ');

      // Simulated save
      await new Promise(resolve => setTimeout(resolve, 500));

      setSaveSuccess(true);
      setIsEditing(false);
      // Reset touched state
      setTouched({
        fullName: false,
        email: false,
        phone: false
      });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile();
    setErrors({
      fullName: '',
      email: '',
      phone: ''
    });
    setTouched({
      fullName: false,
      email: false,
      phone: false
    });
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        {saveSuccess && <div className="success-message">✓ Changes saved successfully!</div>}
      </div>

      <div className="profile-content">
        {/* Profile Card */}
        <div className="profile-left">
          <div className="avatar-circle">
            {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : '?'}
          </div>
          <h2 className="user-name">{formData.fullName || 'No Name Set'}</h2>
          <p className="user-email-sub">{formData.email}</p>
          <div className="role-badge"><ShieldIcon /> Employee</div>
        </div>

        {/* Input Form */}
        <div className="profile-right">
          <div className="info-section-card">
            <div className="section-header">
              <h3>Personal Information</h3>
              <div className="button-group">
                {isEditing && (
                  <button className="cancel-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                )}
                <button className="edit-btn" onClick={handleSave}>
                  {isEditing ? <><SaveIcon /> Save</> : <><PencilIcon /> Edit Profile</>}
                </button>
              </div>
            </div>

            <div className="personal-info-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  className={`form-input-box ${touched.fullName && errors.fullName ? 'error' : ''}`}
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                />
                {touched.fullName && errors.fullName && (
                  <div className="error-message">
                    <AlertIcon /> {errors.fullName}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  className={`form-input-box ${touched.phone && errors.phone ? 'error' : ''}`}
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                />
                {touched.phone && errors.phone && (
                  <div className="error-message">
                    <AlertIcon /> {errors.phone}
                  </div>
                )}
              </div>

              <div className="form-group full-width">
                <label>Email Address</label>
                <input
                  className={`form-input-box ${touched.email && errors.email ? 'error' : ''}`}
                  name="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={!isEditing}
                  placeholder="Enter your email address"
                />
                {touched.email && errors.email && (
                  <div className="error-message">
                    <AlertIcon /> {errors.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;