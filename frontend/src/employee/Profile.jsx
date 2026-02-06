import React, { useState, useEffect } from 'react';
import '../employee/employeecss/Profile.css';
import { supabase } from '../supabaseClient.jsx';
import AddressDropdowns from '../components/AddressDropdowns';

// --- ICONS ---
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const AlertIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({ 
  firstName: 'Employee',
  middleName: 'User',
  lastName: 'User',
  email: 'employee@ecosort.com',
  phone: 'employee@ecosort.com',
  address: {
    region: '',
    province: '',
    city_municipality: '',
    barangay: '',
    street_address: ''
  }
});
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });
  const [passwordTouched, setPasswordTouched] = useState({
    newPassword: false,
    confirmPassword: false,
    otp: false
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [changeToken, setChangeToken] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    pushNotifications: false
  });
  const [joinedDate] = useState('January 15, 2020');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  // Alert modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Alert');
  
  // Toast notification states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' or 'error'

// Fetch profile from Supabase
const fetchProfile = async () => {
  try {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No user logged in");
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, middle_name, email, contact, region, province, city_municipality, barangay, street_address')
      .eq('auth_id', user.id)
      .single();

    if (error) throw error;

    if (data) {
      setFormData({
        firstName: data.first_name || 'Employee',
        middleName: data.middle_name || 'User',
        lastName: data.last_name || 'User',
        email: data.email || 'employee@ecosort.com',
        phone: String(data.contact || 'employee@ecosort.com'),
        address: {
          region: data.region || '',
          province: data.province || '',
          city_municipality: data.city_municipality || '',
          barangay: data.barangay || '',
          street_address: data.street_address || ''
        }
      });
    }
  } catch (err) {
    console.error("Fetch Error:", err.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchProfile();
  }, []);

  // Profile avatar: first letter of logged-in user's first name
  const getInitials = () => {
    const first = (formData.firstName || '').trim();
    if (first) return first.charAt(0).toUpperCase();
    const last = (formData.lastName || '').trim();
    if (last) return last.charAt(0).toUpperCase();
    return 'E';
  };

  // Get full name - remove "User" from display
  const getFullName = () => {
    const nameParts = [formData.firstName, formData.middleName, formData.lastName]
      .filter(part => part && part.toLowerCase() !== 'user');
    return nameParts.join(' ').trim() || 'Employee';
  };

  // Validation function
  const validateField = (field, value) => {
    let error = '';
    switch(field) {
      case 'firstName':
        if (!value.trim()) error = 'First name is required';
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Numbers and special characters are not allowed';
        else if (value.trim().length < 2) error = 'Must be at least 2 characters';
        break;
      case 'lastName':
        if (!value.trim()) error = 'Last name is required';
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Numbers and special characters are not allowed';
        else if (value.trim().length < 2) error = 'Must be at least 2 characters';
        break;
      case 'middleName':
        if (value.trim() && !/^[a-zA-Z\s]+$/.test(value)) error = 'Numbers and special characters are not allowed';
        else if (value.trim().length > 0 && value.trim().length < 2) error = 'Must be at least 2 characters';
        break;
      case 'email': {
        const emailVal = value.trim();
        const atCount = (emailVal.match(/@/g) || []).length;
        const emailRegex = /^[a-zA-Z0-9.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailVal) {
          error = 'Email is required';
        } else if (atCount === 0) {
          error = 'You need to put @';
        } else if (atCount > 1) {
          error = 'Email must contain exactly one @ symbol';
        } else if (atCount === 1) {
          if (emailVal.endsWith('@') || emailVal.endsWith('.')) {
            error = 'Email cannot end with @ or a period';
          } else if (!emailRegex.test(emailVal)) {
            error = 'Invalid domain format (e.g., .com, .ph)';
          }
        }
        break;
      }
      default:
        break;
    }
    return error;
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    let finalValue = value;

    // Format names to uppercase and letters only
    if (['firstName', 'lastName', 'middleName'].includes(field)) {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
    }

    // Format email to lowercase and remove invalid characters
    if (field === 'email') {
      let cleaned = value.replace(/[^a-zA-Z0-9@.]/g, '').toLowerCase();
      const parts = cleaned.split('@');
      if (parts.length > 2) {
        cleaned = parts[0] + '@' + parts.slice(1).join('');
      }
      finalValue = cleaned;
    }

    setFormData({ ...formData, [field]: finalValue });
    setTouched({ ...touched, [field]: true });
    setErrors({ ...errors, [field]: validateField(field, finalValue) });
  };

  // Handle blur
  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    setErrors({ ...errors, [field]: validateField(field, formData[field]) });
  };
  
  // Validate address fields
const validateAddress = () => {
  const addressErrors = {};
  
  if (!formData.address.region) {
    addressErrors.region = 'Region is required';
  }
  if (!formData.address.province) {
    addressErrors.province = 'Province is required';
  }
  if (!formData.address.city_municipality) {
    addressErrors.city_municipality = 'City/Municipality is required';
  }
  if (!formData.address.barangay) {
    addressErrors.barangay = 'Barangay is required';
  }
  
  return addressErrors;
};

  // Password validation
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least 1 capital letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least 1 number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least 1 special character');
    }
    
    return errors;
  };

  // Handle password change
  const handlePasswordChange = (field, value) => {
    setPasswordData({ ...passwordData, [field]: value });
    
    // Validate new password
    if (field === 'newPassword') {
      if (passwordTouched.newPassword) {
        const errors = validatePassword(value);
        setPasswordErrors(prev => ({
          ...prev,
          newPassword: errors.length > 0 ? errors.join(', ') : ''
        }));
      }
      
      // Re-validate confirm password if it's been touched
      if (passwordTouched.confirmPassword && passwordData.confirmPassword) {
        if (value !== passwordData.confirmPassword) {
          setPasswordErrors(prev => ({
            ...prev,
            confirmPassword: 'Passwords do not match'
          }));
        } else {
          setPasswordErrors(prev => ({
            ...prev,
            confirmPassword: ''
          }));
        }
      }
    }
    
    // Validate confirm password
    if (field === 'confirmPassword') {
      if (passwordTouched.confirmPassword) {
        if (value !== passwordData.newPassword) {
          setPasswordErrors(prev => ({
            ...prev,
            confirmPassword: 'Passwords do not match'
          }));
        } else {
          setPasswordErrors(prev => ({
            ...prev,
            confirmPassword: ''
          }));
        }
      }
    }
  };

  // Handle password blur
  const handlePasswordBlur = (field) => {
    setPasswordTouched({ ...passwordTouched, [field]: true });
    
    if (field === 'newPassword') {
      const errors = validatePassword(passwordData.newPassword);
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: errors.length > 0 ? errors.join(', ') : ''
      }));
    }
    
    if (field === 'confirmPassword') {
      if (passwordData.confirmPassword !== passwordData.newPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setPasswordErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
  };

  const handleSave = () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    const newErrors = {};
    ['firstName', 'lastName', 'middleName', 'email', 'phone'].forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ firstName: true, lastName: true, middleName: true, email: true, phone: true });
      setAlertTitle('Validation Error');
      setAlertMessage('Please fix all validation errors before saving.');
      setShowAlertModal(true);
      return;
    }
    const addressErrors = validateAddress();
    if (Object.keys(addressErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...addressErrors }));
      setTouched(prev => ({ ...prev, region: true, province: true, city_municipality: true, barangay: true }));
      setAlertTitle('Validation Error');
      setAlertMessage('Please fill in all required address fields');
      setShowAlertModal(true);
      return;
    }
    setShowSaveConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowSaveConfirmModal(false);
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAlertTitle('Error');
        setAlertMessage('Not logged in');
        setShowAlertModal(true);
        return;
      }
      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          middle_name: formData.middleName,
          contact: formData.phone,
          region: formData.address.region,
          province: formData.address.province,
          city_municipality: formData.address.city_municipality,
          barangay: formData.address.barangay,
          street_address: formData.address.street_address
        })
        .eq('auth_id', user.id);
      if (error) throw error;
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Update error:', err);
      setAlertTitle('Error');
      setAlertMessage('Update failed: ' + err.message);
      setShowAlertModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Backend API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleSendOTP = async () => {
    if (!formData.email) {
      setAlertTitle('Validation Error');
      setAlertMessage('Email is required to send OTP');
      setShowAlertModal(true);
      return;
    }
    try {
      setPasswordLoading(true);
      setOtpMessage('');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setAlertTitle('Session Expired');
        setAlertMessage('Session expired. Please login again.');
        setShowAlertModal(true);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/profile/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.success) {
        setOtpSent(true);
        setOtpVerified(false);
        setOtpMessage(data.message || 'OTP sent to your email. Enter the code below.');
      } else {
        setAlertTitle('Error');
        setAlertMessage(data.message || 'Failed to send OTP');
        setShowAlertModal(true);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to connect to server. Please try again.');
      setShowAlertModal(true);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!passwordData.otp || passwordData.otp.length !== 6) {
      setPasswordErrors(prev => ({ ...prev, otp: 'Please enter a valid 6-digit OTP' }));
      return;
    }
    try {
      setPasswordLoading(true);
      setPasswordErrors(prev => ({ ...prev, otp: '' }));
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setPasswordErrors(prev => ({ ...prev, otp: 'Session expired. Please login again.' }));
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/profile/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ otp: passwordData.otp.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setOtpVerified(true);
        setChangeToken(data.changeToken);
        setOtpMessage('Code verified. Enter your new password below.');
      } else {
        setPasswordErrors(prev => ({ ...prev, otp: data.message || 'Invalid OTP' }));
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setPasswordErrors(prev => ({ ...prev, otp: 'Failed to verify OTP. Please try again.' }));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!otpVerified) {
      setAlertTitle('Validation Error');
      setAlertMessage('Please verify OTP first');
      setShowAlertModal(true);
      return;
    }
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setAlertTitle('Validation Error');
      setAlertMessage('Please fill in new password and confirm password');
      setShowAlertModal(true);
      return;
    }
    const pwdErrors = validatePassword(passwordData.newPassword);
    if (pwdErrors.length > 0) {
      setPasswordTouched({ newPassword: true, confirmPassword: true });
      setPasswordErrors({
        newPassword: pwdErrors.join(', '),
        confirmPassword: passwordData.newPassword !== passwordData.confirmPassword ? 'Passwords do not match' : '',
        otp: ''
      });
      setAlertTitle('Validation Error');
      setAlertMessage('Please fix password validation errors');
      setShowAlertModal(true);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordTouched({ newPassword: true, confirmPassword: true });
      setPasswordErrors({ newPassword: '', confirmPassword: 'Passwords do not match', otp: '' });
      setAlertTitle('Validation Error');
      setAlertMessage('Passwords do not match');
      setShowAlertModal(true);
      return;
    }
    try {
      setPasswordLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setAlertTitle('Session Expired');
        setAlertMessage('Session expired. Please login again.');
        setShowAlertModal(true);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/profile/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ changeToken, newPassword: passwordData.newPassword }),
      });
      const data = await response.json();
      if (data.success) {
        const newPassword = passwordData.newPassword;
        setOtpMessage('');
        setPasswordData({ newPassword: '', confirmPassword: '', otp: '' });
        setPasswordErrors({ newPassword: '', confirmPassword: '', otp: '' });
        setPasswordTouched({ newPassword: false, confirmPassword: false, otp: false });
        setOtpSent(false);
        setOtpVerified(false);
        setChangeToken('');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: newPassword
        });
        if (signInError) {
          setAlertTitle('Success');
          setAlertMessage('Password changed successfully. Please refresh the page or log in again to change password again.');
        } else {
          setAlertTitle('Success');
          setAlertMessage('Password changed successfully. You can change it again anytime.');
        }
        setShowAlertModal(true);
      } else {
        setAlertTitle('Error');
        setAlertMessage(data.message || 'Failed to change password');
        setShowAlertModal(true);
      }
    } catch (error) {
      console.error('Password change error:', error);
      setAlertTitle('Error');
      setAlertMessage('Failed to connect to server. Please try again.');
      setShowAlertModal(true);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading && !isEditing) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1> Profile Settings</h1>
        <p className="profile-subtitle">Manage your account information and preferences</p>
      </div>

      <div className="profile-content">
        {/* Main Content - Scrollable */}
        <div className="profile-main-content">
          {/* Profile Summary Card - At Top */}
          <div className="profile-summary-card">
            <div className="profile-top-section">
              <div className="avatar-container">
                <div className="avatar-circle">
                  {getInitials()}
                </div>
              </div>
              <div className="profile-info-middle">
                <h2 className="user-name">{getFullName()}</h2>
                <p className="user-email">{formData.email}</p>
                <div className="role-badge">
                  <ShieldIcon />
                  <span>Collector</span>
                </div>
                <p className="joined-date">Joined {joinedDate}</p>
              </div>
            </div>
          </div>
          {/* Personal Information Section */}
          <div className="info-section">
            <div className="section-header-row">
              <h3>Personal Information</h3>
              {!isEditing && (
                <button type="button" className="edit-btn" onClick={() => setIsEditing(true)}>
                  Edit Information
                </button>
              )}
            </div>

            <div className="personal-info-grid">
              <div className={`form-group ${touched.firstName && errors.firstName ? 'has-error' : ''}`}>
                <label>First Name *</label>
                <input
                  type="text"
                  className={`form-input ${touched.firstName && errors.firstName ? 'error' : ''}`}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onBlur={() => handleBlur('firstName')}
                  disabled={!isEditing}
                  placeholder="First Name"
                />
                {touched.firstName && errors.firstName && (
                  <span className="error-message">{errors.firstName}</span>
                )}
              </div>

              <div className={`form-group ${touched.middleName && errors.middleName ? 'has-error' : ''}`}>
                <label>Middle Name</label>
                <input
                  type="text"
                  className={`form-input ${touched.middleName && errors.middleName ? 'error' : ''}`}
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  onBlur={() => handleBlur('middleName')}
                  disabled={!isEditing}
                  placeholder="Middle Name"
                />
                {touched.middleName && errors.middleName && (
                  <span className="error-message">{errors.middleName}</span>
                )}
              </div>

              <div className={`form-group ${touched.lastName && errors.lastName ? 'has-error' : ''}`}>
                <label>Last Name *</label>
                <input
                  type="text"
                  className={`form-input ${touched.lastName && errors.lastName ? 'error' : ''}`}
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onBlur={() => handleBlur('lastName')}
                  disabled={!isEditing}
                  placeholder="Last Name"
                />
                {touched.lastName && errors.lastName && (
                  <span className="error-message">{errors.lastName}</span>
                )}
              </div>

              {/* Address Section */}
              <div className="address-subsection">
                <h4 className="address-section-title">Address Information</h4>
                <AddressDropdowns
                  value={formData.address}
                  onChange={(newAddress) => setFormData({ ...formData, address: newAddress })}
                  disabled={!isEditing}
                  errors={errors}
                  touched={touched}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className={`form-input ${touched.email && errors.email ? 'error' : ''}`}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={!isEditing}
                  placeholder="Email Address"
                />
                {touched.email && errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>
            </div>
            

            {isEditing && (
              <div className="action-buttons">
                <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            )}

            {saveSuccess && (
              <div className="success-message">
                ✓ Changes saved successfully!
              </div>
            )}
          </div>

          {/* Bottom Sections: Password & Preferences */}
          <div className="bottom-sections">
            {/* Change Password Section */}
          <div className="password-section">
            <div className="section-title">
              <LockIcon />
              <h3>Change Password</h3>
            </div>
            <div className="password-form">
              {passwordLoading && (
                <div className="password-inline-loading">
                  {!otpSent ? 'Sending OTP...' : !otpVerified ? 'Verifying code...' : 'Saving...'}
                </div>
              )}
              {!otpSent ? (
                <>
                  <p className="password-step-hint">We&apos;ll send a verification code to your email. Click below to receive it.</p>
                  <button type="button" className="change-password-btn" onClick={handleSendOTP} disabled={passwordLoading}>
                    Send OTP Code
                  </button>
                </>
              ) : !otpVerified ? (
                <>
                  {otpMessage && <div className="otp-message">{otpMessage}</div>}
                  <div className="form-group">
                    <label>Enter Verification Code (OTP)</label>
                    <input
                      type="text"
                      className={`form-input ${passwordTouched.otp && passwordErrors.otp ? 'error' : ''}`}
                      value={passwordData.otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setPasswordData({ ...passwordData, otp: value });
                        setPasswordErrors(prev => ({ ...prev, otp: '' }));
                      }}
                      onBlur={() => setPasswordTouched({ ...passwordTouched, otp: true })}
                      placeholder="000000"
                      maxLength="6"
                    />
                    {passwordTouched.otp && passwordErrors.otp && <div className="error-message">{passwordErrors.otp}</div>}
                  </div>
                  <button type="button" className="change-password-btn" onClick={handleVerifyOTP} disabled={passwordLoading || passwordData.otp.length !== 6}>
                    Verify OTP
                  </button>
                  <button type="button" className="otp-link" onClick={(e) => { e.preventDefault(); setOtpSent(false); setPasswordData({ ...passwordData, otp: '' }); setPasswordErrors(prev => ({ ...prev, otp: '' })); setOtpMessage(''); }}>
                    Cancel / Request New OTP
                  </button>
                </>
              ) : (
                <>
                  {otpMessage && <div className="otp-message otp-message-success">{otpMessage}</div>}
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input ${passwordTouched.newPassword && passwordErrors.newPassword ? 'error' : ''}`}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      onBlur={() => handlePasswordBlur('newPassword')}
                      placeholder="••••••••••••"
                    />
                    {passwordTouched.newPassword && passwordErrors.newPassword && <div className="error-message">{passwordErrors.newPassword}</div>}
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input ${passwordTouched.confirmPassword && passwordErrors.confirmPassword ? 'error' : ''}`}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      onBlur={() => handlePasswordBlur('confirmPassword')}
                      placeholder="••••••••••••"
                    />
                    {passwordTouched.confirmPassword && passwordErrors.confirmPassword && <div className="error-message">{passwordErrors.confirmPassword}</div>}
                  </div>
                  <div className="form-group password-show-checkbox">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                      <span>Show password</span>
                    </label>
                  </div>
                  <button type="button" className="change-password-btn" onClick={handleChangePassword} disabled={passwordLoading}>
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
        </div>
      </div>

      {showSaveConfirmModal && (
        <div className="terms-modal-overlay" onClick={() => setShowSaveConfirmModal(false)}>
          <div className="terms-modal-content terms-modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <h2>Confirm Save</h2>
            </div>
            <div className="terms-modal-body" style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#374151' }}>Are you sure you want to save these changes to your information?</p>
            </div>
            <div className="terms-modal-footer">
              <button type="button" className="terms-cancel-btn" onClick={() => setShowSaveConfirmModal(false)}>Cancel</button>
              <button type="button" className="terms-accept-btn" onClick={handleConfirmSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="terms-modal-overlay" onClick={() => setShowAlertModal(false)}>
          <div className="terms-modal-content terms-modal-compact" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <h2>{alertTitle}</h2>
            </div>
            <div className="terms-modal-body" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ marginBottom: '20px' }}>
                <AlertIcon />
              </div>
              <p style={{ whiteSpace: 'pre-line', fontSize: '16px', color: '#374151' }}>{alertMessage}</p>
            </div>
            <div className="terms-modal-footer">
              <button 
                className="terms-accept-btn" 
                onClick={() => setShowAlertModal(false)}
                style={{ width: '100%' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for OTP */}
      {showToast && (
        <div 
          className="toast-notification"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: toastType === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            zIndex: 10001,
            maxWidth: '400px',
            animation: 'slideInRight 0.3s ease-out',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
              {toastMessage}
            </div>
          </div>
          <button
            onClick={() => setShowToast(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: '1',
              padding: '0',
              marginLeft: '8px',
              opacity: '0.8'
            }}
          >
            ×
          </button>
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Profile;
