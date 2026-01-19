import React, { useState, useEffect } from 'react';
import '../employee/employeecss/Profile.css';
import { supabase } from '../supabaseClient.jsx';

// --- ICONS ---
const ShieldIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const PencilIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const SaveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const AlertIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
const LockIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  
  // Master Edit State (Controls everything)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  // Sub-state for Password (only active if master is active)
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  const [formData, setFormData] = useState({ 
    fullName: '', 
    email: '', 
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // --- VALIDATION HELPERS ---
  const validateFullName = (name) => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validatePhone = (phone) => {
    const phoneStr = String(phone || '').trim();
    if (!phoneStr) return 'Phone number is required';
    // Basic length check
    if (phoneStr.replace(/\D/g, '').length < 10) return 'Phone number must be at least 10 digits';
    return '';
  };

  const validateCurrentPassword = (current) => {
    if (!current) return 'Current password is required';
    return '';
  };

  const validateNewPassword = (pass) => {
    if (!pass) return 'New password is required'; 
    if (pass.length < 6) return 'Min. 6 characters required';
    return '';
  };

  const validateConfirmPassword = (confirm, original) => {
    if (!confirm) return 'Please confirm your password';
    if (confirm !== original) return 'Passwords do not match';
    return '';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this specific field when typing
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, middle_name, email, contact')
        .eq('auth_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const middle = (data.middle_name && data.middle_name.trim()) ? ` ${data.middle_name} ` : ' ';
        const fullName = `${data.first_name}${middle}${data.last_name}`;
        
        setFormData(prev => ({
          ...prev,
          fullName: fullName,
          email: data.email || '',
          phone: String(data.contact || '')
        }));
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

  // --- SAVE PROFILE INFO ---
  const handleUpdateProfile = async () => {
    const fullNameError = validateFullName(formData.fullName);
    const phoneError = validatePhone(formData.phone);

    if (fullNameError || phoneError) {
      setErrors(prev => ({ ...prev, fullName: fullNameError, phone: phoneError }));
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const nameParts = formData.fullName.trim().split(' ').filter(p => p.length > 0);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

      const { error: updateProfileError } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          contact: formData.phone
        })
        .eq('auth_id', user.id);

      if (updateProfileError) throw updateProfileError;

      setProfileSuccess(true);
      setIsEditingProfile(false);
      // Close password section when main edit ends
      setIsChangingPassword(false); 
      setTimeout(() => setProfileSuccess(false), 3000);

    } catch (err) {
      alert("Profile update failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE PASSWORD ---
  const handleUpdatePassword = async () => {
    const currentPassError = validateCurrentPassword(formData.currentPassword);
    const newPassError = validateNewPassword(formData.newPassword);
    const confirmPassError = validateConfirmPassword(formData.confirmPassword, formData.newPassword);

    if (currentPassError || newPassError || confirmPassError) {
      setErrors(prev => ({
        ...prev,
        currentPassword: currentPassError,
        newPassword: newPassError,
        confirmPassword: confirmPassError
      }));
      return;
    }

    try {
      setPassLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Verify Current Password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword
      });

      if (signInError) {
        setErrors(prev => ({ ...prev, currentPassword: "Incorrect current password" }));
        setPassLoading(false);
        return;
      }

      // Update to New Password
      const { error: updatePassError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });
      if (updatePassError) throw updatePassError;

      setPassSuccess(true);
      // Clear password fields
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      // Close password edit mode
      setIsChangingPassword(false);
      setShowAllPasswords(false);
      setTimeout(() => setPassSuccess(false), 3000);

    } catch (err) {
      alert("Password update failed: " + err.message);
    } finally {
      setPassLoading(false);
    }
  };

  // --- CANCEL HANDLERS ---
  const handleCancelProfile = () => {
    setIsEditingProfile(false);
    setIsChangingPassword(false); // Also close password section
    fetchProfile(); 
    setErrors(prev => ({ ...prev, fullName: '', phone: '' }));
  };

  const handleCancelPassword = () => {
    setIsChangingPassword(false);
    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    setErrors(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    setShowAllPasswords(false);
  };

  if (loading && !formData.email) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        {profileSuccess && <div className="success-message">✓ Profile updated!</div>}
        {passSuccess && <div className="success-message">✓ Password changed!</div>}
      </div>

      <div className="profile-content">
        {/* LEFT SIDE: AVATAR */}
        <div className="profile-left">
          <div className="avatar-circle">
            {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : '?'}
          </div>
          <h2 className="user-name">{formData.fullName || 'User'}</h2>
          <p className="user-email-sub">{formData.email}</p>
          <div className="role-badge"><ShieldIcon /> Employee</div>
        </div>

        <div className="profile-right">
          
          {/* --- SECTION 1: PERSONAL INFORMATION --- */}
          <div className="info-section-card">
            <div className="section-header">
              <h3>Personal Information</h3>
              <div className="button-group">
                {isEditingProfile ? (
                  <>
                    <button className="cancel-btn" onClick={handleCancelProfile}>Cancel</button>
                    <button className="save-btn" onClick={handleUpdateProfile} disabled={loading}>
                      {loading ? 'Saving...' : <><SaveIcon /> Save</>}
                    </button>
                  </>
                ) : (
                  <button className="edit-btn" onClick={() => setIsEditingProfile(true)}>
                    <PencilIcon /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="personal-info-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  className={`form-input-box ${errors.fullName ? 'error' : ''}`}
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  disabled={!isEditingProfile}
                  placeholder="John Doe"
                />
                {errors.fullName && <div className="error-message"><AlertIcon /> {errors.fullName}</div>}
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  className={`form-input-box ${errors.phone ? 'error' : ''}`}
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditingProfile}
                  placeholder="0912 345 6789"
                />
                {errors.phone && <div className="error-message"><AlertIcon /> {errors.phone}</div>}
              </div>

              <div className="form-group full-width">
                <label>Email Address</label>
                <input
                  className="form-input-box"
                  value={formData.email}
                  disabled={true} 
                  style={{ backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          </div>

          {/* --- SECTION 2: SECURITY --- */}
          {/* LOGIC FIX: Access to Change Password is gated by isEditingProfile */}
          <div className="info-section-card">
            <div className="section-header">
              <h3>Security</h3>
              
              {/* BUTTON GROUP: Only visible if Main Profile is in Edit Mode OR we are currently changing password */}
              {(isEditingProfile || isChangingPassword) && (
                <div className="button-group">
                  {isChangingPassword ? (
                    <button className="cancel-btn" onClick={handleCancelPassword}>Cancel</button>
                  ) : (
                    <button className="edit-btn" onClick={() => setIsChangingPassword(true)}>
                      <LockIcon /> Change Password
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isChangingPassword ? (
              <div style={{ color: '#6B7280', fontStyle: 'italic' }}>
                Password last changed: (Securely managed)
                {!isEditingProfile && <span style={{display:'block', fontSize:'0.85rem', marginTop:'4px'}}>Click "Edit Profile" above to access password settings.</span>}
              </div>
            ) : (
              <div className="personal-info-grid">
                <div className="form-group full-width">
                  <label>Current Password</label>
                  <input
                    type={showAllPasswords ? "text" : "password"}
                    className={`form-input-box ${errors.currentPassword ? 'error' : ''}`}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                  />
                  {errors.currentPassword && <div className="error-message"><AlertIcon /> {errors.currentPassword}</div>}
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type={showAllPasswords ? "text" : "password"}
                    className={`form-input-box ${errors.newPassword ? 'error' : ''}`}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="Min. 6 chars"
                  />
                  {errors.newPassword && <div className="error-message"><AlertIcon /> {errors.newPassword}</div>}
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type={showAllPasswords ? "text" : "password"}
                    className={`form-input-box ${errors.confirmPassword ? 'error' : ''}`}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Retype password"
                  />
                  {errors.confirmPassword && <div className="error-message"><AlertIcon /> {errors.confirmPassword}</div>}
                </div>

                <div className="form-group full-width" style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <input 
                    type="checkbox" 
                    id="showPassToggle" 
                    checked={showAllPasswords}
                    onChange={(e) => setShowAllPasswords(e.target.checked)}
                    style={{width:'auto', height:'auto', margin:0, cursor:'pointer'}}
                  />
                  <label htmlFor="showPassToggle" style={{margin:0, fontSize:'0.9rem', cursor:'pointer', color:'#4B5563'}}>Show Passwords</label>
                </div>

                <div className="form-group full-width">
                  <button 
                    className="save-btn" 
                    onClick={handleUpdatePassword} 
                    disabled={passLoading}
                    style={{ 
                      width: '100%', 
                      marginTop: '10px', 
                      justifyContent:'center',
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {passLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;