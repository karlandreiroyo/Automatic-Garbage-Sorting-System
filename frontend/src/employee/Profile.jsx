import React, { useState, useEffect } from 'react';
import '../employee/employeecss/Profile.css';
import { supabase } from '../supabaseClient.jsx';

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

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
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

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
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
    phone: 'employee@ecosort.com'
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    pushNotifications: false
  });
  const [joinedDate] = useState('January 15, 2020');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

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
        .select('first_name, last_name, middle_name, email, contact')
        .eq('auth_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          firstName: data.first_name || 'Employee',
          middleName: data.middle_name || 'User',
          lastName: data.last_name || 'User',
          email: data.email || 'employee@ecosort.com',
          phone: String(data.contact || 'employee@ecosort.com')
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

  // Get user initials - show "U" for User
  const getInitials = () => {
    return 'U';
  };

  // Get full name - remove "User" from display
  const getFullName = () => {
    const nameParts = [formData.firstName, formData.middleName, formData.lastName]
      .filter(part => part && part.toLowerCase() !== 'user');
    return nameParts.join(' ').trim() || 'Employee';
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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

  // Handle preference toggle
  const handlePreferenceToggle = (pref) => {
    setPreferences({ ...preferences, [pref]: !preferences[pref] });
  };

  // Handle save
  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // Show Terms and Conditions modal before saving
    setHasScrolledToBottom(false); // Reset scroll state when modal opens
    setShowTermsModal(true);
  };

  // Check if content is already at bottom when modal opens
  useEffect(() => {
    if (showTermsModal) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const modalBody = document.querySelector('.terms-modal-body');
        if (modalBody) {
          const isAtBottom = modalBody.scrollHeight - modalBody.scrollTop <= modalBody.clientHeight + 10;
          setHasScrolledToBottom(isAtBottom);
        }
      }, 100);
    }
  }, [showTermsModal]);

  // Handle accept terms and save
  const handleAcceptTermsAndSave = async () => {
    if (!hasScrolledToBottom) {
      return;
    }
    
    setShowTermsModal(false);
    setHasScrolledToBottom(false); // Reset for next time
    
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("Not logged in");
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          middle_name: formData.middleName,
          contact: formData.phone
        })
        .eq('auth_id', user.id);

      if (error) throw error;

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Update error:", err);
      alert("Update failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Backend API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Send OTP for password change
  const handleSendOTP = async () => {
    if (!formData.email) {
      alert("Email is required to send OTP");
      return;
    }

    try {
      setLoading(true);
      setOtpMessage('');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        alert('Session expired. Please login again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/send-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setOtpVerified(false);
        setOtpMessage(data.message || 'OTP sent to your email. Check terminal for code.');
        // Show OTP in alert if available
        if (data.otp) {
          alert(`OTP Code: ${data.otp}\n\nThis code is also visible in the terminal and sent to your email.`);
        }
      } else {
        alert(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      alert("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!passwordData.otp || passwordData.otp.length !== 6) {
      setPasswordErrors(prev => ({
        ...prev,
        otp: 'Please enter a valid 6-digit OTP'
      }));
      return;
    }

    try {
      setLoading(true);
      setPasswordErrors(prev => ({ ...prev, otp: '' }));

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setPasswordErrors(prev => ({ ...prev, otp: 'Session expired. Please login again.' }));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/verify-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          otp: passwordData.otp.trim() 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpVerified(true);
        setChangeToken(data.changeToken);
        setOtpMessage('OTP verified successfully! You can now change your password.');
      } else {
        setPasswordErrors(prev => ({
          ...prev,
          otp: data.message || 'Invalid OTP'
        }));
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      setPasswordErrors(prev => ({
        ...prev,
        otp: 'Failed to verify OTP. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle password change (after OTP verification)
  const handleChangePassword = async () => {
    // Validate all fields
    if (!otpVerified) {
      alert("Please verify OTP first");
      return;
    }

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      alert("Please fill in new password and confirm password");
      return;
    }

    // Validate new password
    const passwordErrors = validatePassword(passwordData.newPassword);
    if (passwordErrors.length > 0) {
      setPasswordTouched({ newPassword: true, confirmPassword: true });
      setPasswordErrors({
        newPassword: passwordErrors.join(', '),
        confirmPassword: passwordData.newPassword !== passwordData.confirmPassword ? 'Passwords do not match' : '',
        otp: ''
      });
      alert("Please fix password validation errors");
      return;
    }

    // Validate password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordTouched({ newPassword: true, confirmPassword: true });
      setPasswordErrors({
        newPassword: '',
        confirmPassword: 'Passwords do not match',
        otp: ''
      });
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        alert('Session expired. Please login again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          changeToken,
          newPassword: passwordData.newPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Password changed successfully!");
        // Reset all password-related state
        setPasswordData({ newPassword: '', confirmPassword: '', otp: '' });
        setPasswordErrors({ newPassword: '', confirmPassword: '', otp: '' });
        setPasswordTouched({ newPassword: false, confirmPassword: false, otp: false });
        setOtpSent(false);
        setOtpVerified(false);
        setChangeToken('');
        setOtpMessage('');
      } else {
        alert(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error("Password change error:", error);
      alert("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isEditing) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p className="profile-subtitle">Manage your account information and preferences</p>
      </div>

      <div className="profile-content">
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
                <span>Employee</span>
              </div>
              <p className="joined-date">Joined {joinedDate}</p>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="profile-main-content">
          {/* Personal Information Section */}
          <div className="info-section">
            <div className="section-header-row">
              <h3>Personal Information</h3>
              {!isEditing && (
                <button className="edit-link" onClick={() => setIsEditing(true)}>
                  Edit Information
                </button>
              )}
            </div>

            <div className="personal-info-grid">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  placeholder="First Name"
                />
              </div>

              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Middle Name"
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Last Name"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Email Address"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Phone Number"
                />
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
              {!otpSent ? (
                <>
                  <div className="form-group">
                    <label>Type New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className={`form-input ${passwordTouched.newPassword && passwordErrors.newPassword ? 'error' : ''}`}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        onBlur={() => handlePasswordBlur('newPassword')}
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {passwordTouched.newPassword && passwordErrors.newPassword && (
                      <div className="error-message">
                        {passwordErrors.newPassword}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className={`form-input ${passwordTouched.confirmPassword && passwordErrors.confirmPassword ? 'error' : ''}`}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        onBlur={() => handlePasswordBlur('confirmPassword')}
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {passwordTouched.confirmPassword && passwordErrors.confirmPassword && (
                      <div className="error-message">
                        {passwordErrors.confirmPassword}
                      </div>
                    )}
                  </div>
                  <button 
                    className="change-password-btn" 
                    onClick={handleSendOTP}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send OTP Code'}
                  </button>
                </>
              ) : !otpVerified ? (
                <>
                  {otpMessage && (
                    <div className="otp-message" style={{ 
                      padding: '10px', 
                      marginBottom: '15px', 
                      backgroundColor: '#e3f2fd', 
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#1976d2'
                    }}>
                      {otpMessage}
                    </div>
                  )}
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
                    {passwordTouched.otp && passwordErrors.otp && (
                      <div className="error-message">
                        {passwordErrors.otp}
                      </div>
                    )}
                  </div>
                  <button 
                    className="change-password-btn" 
                    onClick={handleVerifyOTP}
                    disabled={loading || passwordData.otp.length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button 
                    className="otp-link" 
                    onClick={(e) => {
                      e.preventDefault();
                      setOtpSent(false);
                      setPasswordData({ ...passwordData, otp: '' });
                      setPasswordErrors(prev => ({ ...prev, otp: '' }));
                      setOtpMessage('');
                    }}
                    style={{ 
                      display: 'block', 
                      marginTop: '10px', 
                      textAlign: 'center',
                      cursor: 'pointer',
                      color: '#10b981',
                      textDecoration: 'none'
                    }}
                  >
                    Cancel / Request New OTP
                  </button>
                </>
              ) : (
                <>
                  {otpMessage && (
                    <div className="otp-message" style={{ 
                      padding: '10px', 
                      marginBottom: '15px', 
                      backgroundColor: '#e8f5e9', 
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#2e7d32'
                    }}>
                      {otpMessage}
                    </div>
                  )}
                  <div className="form-group">
                    <label>Type New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className={`form-input ${passwordTouched.newPassword && passwordErrors.newPassword ? 'error' : ''}`}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        onBlur={() => handlePasswordBlur('newPassword')}
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {passwordTouched.newPassword && passwordErrors.newPassword && (
                      <div className="error-message">
                        {passwordErrors.newPassword}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className={`form-input ${passwordTouched.confirmPassword && passwordErrors.confirmPassword ? 'error' : ''}`}
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        onBlur={() => handlePasswordBlur('confirmPassword')}
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {passwordTouched.confirmPassword && passwordErrors.confirmPassword && (
                      <div className="error-message">
                        {passwordErrors.confirmPassword}
                      </div>
                    )}
                  </div>
                  <button 
                    className="change-password-btn" 
                    onClick={handleChangePassword}
                    disabled={loading}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Preferences Section */}
          <div className="preferences-section">
            <h3>Preferences</h3>
            <div className="preference-item">
              <div className="preference-info">
                <BellIcon />
                <div>
                  <div className="preference-title">Email Notifications</div>
                  <div className="preference-desc">Receive alerts via email</div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={() => handlePreferenceToggle('emailNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="preference-item">
              <div className="preference-info">
                <BellIcon />
                <div>
                  <div className="preference-title">Push Notifications</div>
                  <div className="preference-desc">Receive alerts in browser</div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={() => handlePreferenceToggle('pushNotifications')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="terms-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <h2>Terms and Conditions & Privacy Policy</h2>
              <button className="terms-close-btn" onClick={() => setShowTermsModal(false)}>×</button>
            </div>
            
            <div 
              className="terms-modal-body"
              onScroll={(e) => {
                const element = e.target;
                const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10; // 10px threshold
                setHasScrolledToBottom(isAtBottom);
              }}
            >
              {/* Terms and Conditions Card */}
              <div className="terms-card">
                <h3 className="terms-card-title">Terms and Conditions</h3>
                <div className="terms-card-content">
                  <div className="terms-section">
                    <h4>1. Acceptance of Terms</h4>
                    <p>By creating an account and using SoilScan services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>2. Account Registration</h4>
                    <p>You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>3. Use of Services</h4>
                    <ul>
                      <li>You agree to use our services only for lawful purposes</li>
                      <li>You will not attempt to interfere with or disrupt our systems</li>
                      <li>You will not share your account with unauthorized users</li>
                      <li>You will comply with all applicable laws and regulations</li>
                    </ul>
                  </div>
                  
                  <div className="terms-section">
                    <h4>4. Data Privacy</h4>
                    <p>We collect and process your personal data in accordance with our Privacy Policy. Your farm data is encrypted and stored securely. We will never sell your personal information to third parties.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>5. Service Availability</h4>
                    <p>While we strive for 99.9% uptime, we cannot guarantee uninterrupted service. We reserve the right to perform maintenance and updates that may temporarily affect service availability.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>6. Warranty and Liability</h4>
                    <p>Hardware comes with manufacturer warranty as specified in your package. We are not liable for crop losses or damages resulting from sensor malfunction, incorrect data interpretation, or force majeure events.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>7. Payment Terms</h4>
                    <p>All hardware purchases are one-time payments. Subscription fees (if applicable) are billed monthly or annually. Refunds are available within 30 days of purchase for unused hardware in original condition.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>8. Termination</h4>
                    <p>We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, your access to services will be revoked, though your data will be available for download for 90 days.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>9. Changes to Terms</h4>
                    <p>We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the modified terms.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>10. Contact Information</h4>
                    <p>For questions about these terms, please contact us at support@soilscan.com or through our contact form.</p>
                  </div>
                </div>
              </div>

              {/* Privacy Policy Card */}
              <div className="terms-card">
                <h3 className="terms-card-title">Privacy Policy</h3>
                <div className="terms-card-content">
                  <div className="terms-section">
                    <h4>1. Information We Collect</h4>
                    <p>We collect information you provide directly to us, including your name, email address, phone number, farm location, and farm size. We also collect sensor data from your IoT devices, including soil NPK levels, timestamps, and device identifiers.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>2. How We Use Your Information</h4>
                    <p>We use the information we collect to:</p>
                    <ul>
                      <li>Provide, maintain, and improve our services</li>
                      <li>Process your orders and payments</li>
                      <li>Send you technical notices and support messages</li>
                      <li>Provide AI-powered recommendations based on your soil data</li>
                      <li>Communicate with you about products, services, and promotional offers</li>
                      <li>Monitor and analyze trends, usage, and activities</li>
                    </ul>
                  </div>
                  
                  <div className="terms-section">
                    <h4>3. Data Sharing and Disclosure</h4>
                    <p>We do not sell your personal information. We may share your information with:</p>
                    <ul>
                      <li>Service providers who perform services on our behalf</li>
                      <li>Professional advisors such as lawyers and accountants</li>
                      <li>Law enforcement when required by law</li>
                    </ul>
                  </div>
                  
                  <div className="terms-section">
                    <h4>4. Data Security</h4>
                    <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your sensor data is encrypted both in transit and at rest using industry-standard encryption protocols.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>5. Data Retention</h4>
                    <p>We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Sensor data is retained for up to 5 years to enable historical analysis and trending.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>6. Your Rights</h4>
                    <p>You have the right to:</p>
                    <ul>
                      <li>Access and receive a copy of your personal information</li>
                      <li>Correct inaccurate or incomplete information</li>
                      <li>Request deletion of your information</li>
                      <li>Object to or restrict certain processing activities</li>
                      <li>Export your data in a portable format</li>
                    </ul>
                  </div>
                  
                  <div className="terms-section">
                    <h4>7. Cookies and Tracking</h4>
                    <p>We use cookies and similar tracking technologies to collect information about your browsing activities and to remember your preferences. You can control cookies through your browser settings.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>8. Third-Party Services</h4>
                    <p>Our services may contain links to third-party websites or integrate with third-party services. We are not responsible for the privacy practices of these third parties.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>9. Children's Privacy</h4>
                    <p>Our services are not directed to individuals under 18. We do not knowingly collect personal information from children.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>10. Changes to Privacy Policy</h4>
                    <p>We may update this privacy policy from time to time. We will notify you of material changes by email or through our services.</p>
                  </div>
                  
                  <div className="terms-section">
                    <h4>11. Contact Us</h4>
                    <p>For privacy-related questions or to exercise your rights, contact us at privacy@soilscan.com or write to us at: SoilScan Data Protection Officer, 123 Agriculture Boulevard, Quezon City, Philippines.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="terms-modal-footer">
              <button className="terms-cancel-btn" onClick={() => {
                setShowTermsModal(false);
                setHasScrolledToBottom(false);
              }}>
                Cancel
              </button>
              <button 
                className="terms-accept-btn" 
                onClick={handleAcceptTermsAndSave}
                disabled={!hasScrolledToBottom}
              >
                Done / Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
