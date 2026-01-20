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
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordTouched, setPasswordTouched] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: false,
    pushNotifications: false
  });
  const [joinedDate] = useState('January 15, 2020');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  // Handle password change
  const handleChangePassword = async () => {
    // Validate all fields
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }

    // Validate new password
    const passwordErrors = validatePassword(passwordData.newPassword);
    if (passwordErrors.length > 0) {
      setPasswordTouched({ newPassword: true, confirmPassword: true });
      setPasswordErrors({
        newPassword: passwordErrors.join(', '),
        confirmPassword: passwordData.newPassword !== passwordData.confirmPassword ? 'Passwords do not match' : ''
      });
      alert("Please fix password validation errors");
      return;
    }

    // Validate password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordTouched({ newPassword: true, confirmPassword: true });
      setPasswordErrors({
        newPassword: '',
        confirmPassword: 'Passwords do not match'
      });
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      alert("Password changed successfully!");
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({ newPassword: '', confirmPassword: '' });
      setPasswordTouched({ newPassword: false, confirmPassword: false });
    } catch (err) {
      console.error("Password change error:", err);
      alert("Password change failed: " + err.message);
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
              <button className="camera-button">
                <CameraIcon />
              </button>
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
              <div className="form-group">
                <label>Type Old Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordData.oldPassword}
                  onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                  placeholder="••••••••••••"
                />
              </div>
              <div className="form-group">
                <label>Type New Password</label>
                <input
                  type="password"
                  className={`form-input ${passwordTouched.newPassword && passwordErrors.newPassword ? 'error' : ''}`}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  onBlur={() => handlePasswordBlur('newPassword')}
                  placeholder="••••••••••••"
                />
                {passwordTouched.newPassword && passwordErrors.newPassword && (
                  <div className="error-message">
                    {passwordErrors.newPassword}
                  </div>
                )}
              </div>
              <button className="change-password-btn" onClick={handleChangePassword}>
                Change Password
              </button>
              <a href="#" className="otp-link" onClick={(e) => { e.preventDefault(); alert("OTP code sent to your email"); }}>
                Send OTP Code
              </a>
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
    </div>
  );
};

export default Profile;
