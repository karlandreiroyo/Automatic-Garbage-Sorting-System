import React, { useState, useRef } from 'react';
import '../employee/employeecss/Profile.css';

        // --- ICONS ---
        const CameraIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
        const ShieldIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
        const CalendarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
        const IdIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h18"></path></svg>;
        const PencilIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
        const SaveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
        const BellIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
        const LockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
        const EyeIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
        const EyeOffIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>;
        const AlertIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;

        const Profile = () => {
          const [isEditing, setIsEditing] = useState(false);
          const [formData, setFormData] = useState({ fullName: 'Employee User', email: 'employee@ecosort.com', phone: '0912 345 6789' });
          const [errors, setErrors] = useState({});
          const [saveSuccess, setSaveSuccess] = useState(false);
          
          // Notification & Security States
          const [emailNotif, setEmailNotif] = useState(true);
          const [pushNotif, setPushNotif] = useState(true);
          const [isChangingPassword, setIsChangingPassword] = useState(false);
          const [showPassword, setShowPassword] = useState(false);
          const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
          const [validationMsg, setValidationMsg] = useState(null);

          // Avatar States
          const [profilePic, setProfilePic] = useState(null);
          const [avatarMsg, setAvatarMsg] = useState(null);
          const fileInputRef = useRef(null);

          // --- CONSOLIDATED VALIDATIONS ---
          const validateForm = () => {
            const newErrors = {};
            
            // Full Name Validation
            if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
            else if (!/^[a-zA-Z\s'-]+$/.test(formData.fullName)) newErrors.fullName = 'Letters and basic punctuation only';
            
            // Email Validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!formData.email.trim()) newErrors.email = 'Email is required';
            else if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email format';

            // Phone Validation (PH format)
            const cleanPhone = formData.phone.replace(/\s/g, '');
            const phoneRegex = /^(\+63|0)?9\d{9}$/;
            if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
            else if (!phoneRegex.test(cleanPhone)) newErrors.phone = 'Use format: 0912 345 6789';

            return newErrors;
          };

          // --- HANDLERS ---
          const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
            if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
            setSaveSuccess(false);
          };

          const handleSaveProfile = () => {
            if (isEditing) {
              const valErrors = validateForm();
              if (Object.keys(valErrors).length > 0) {
                setErrors(valErrors);
                return;
              }
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
            }
            setIsEditing(!isEditing);
            setErrors({});
          };

          const handleCancelEdit = () => {
            setFormData({ fullName: 'Employee User', email: 'employee@ecosort.com', phone: '0912 345 6789' });
            setIsEditing(false);
            setErrors({});
          };

          const handleAvatarClick = () => {
            if (!isEditing) {
              setAvatarMsg("Enable 'Edit Profile' to change photo");
              setTimeout(() => setAvatarMsg(null), 2500);
              return;
            }
            fileInputRef.current.click();
          };

          const handleSavePassword = () => {
            if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
              setValidationMsg({ type: 'error', text: 'All fields are required.' });
              return;
            }
            if (passwordData.new.length < 6) {
              setValidationMsg({ type: 'error', text: 'Minimum 6 characters required.' });
              return;
            }
            if (passwordData.new !== passwordData.confirm) {
              setValidationMsg({ type: 'error', text: 'Passwords do not match.' });
              return;
            }
            setValidationMsg({ type: 'success', text: 'Password updated!' });
            setTimeout(() => {
              setIsChangingPassword(false);
              setPasswordData({ current: '', new: '', confirm: '' });
              setValidationMsg(null);
            }, 1500);
          };

          return (
            <div className="profile-container">
              <div className="profile-header">
                <h1>Profile Settings</h1>
                <p>Manage your account information and preferences</p>
              </div>

              {saveSuccess && (
                <div className="success-message"><span>✓</span> Profile updated successfully!</div>
              )}

              <div className="profile-content">
                {/* LEFT SIDE */}
                <div className="profile-left">
                  <div className="left-card-inner">
                    <div className="avatar-wrapper" onClick={handleAvatarClick} style={{ cursor: isEditing ? 'pointer' : 'not-allowed' }}>
                      <input type="file" ref={fileInputRef} onChange={(e) => setProfilePic(URL.createObjectURL(e.target.files[0]))} style={{ display: 'none' }} accept="image/*" />
                      <div className="avatar-circle">
                        {profilePic ? <img src={profilePic} alt="Profile" /> : formData.fullName.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div className="camera-btn" style={{ backgroundColor: isEditing ? '#008751' : '#ccc' }}><CameraIcon /></div>
                      {avatarMsg && <div className="avatar-tooltip">{avatarMsg}</div>}
                    </div>
                    <h2 className="user-name">{formData.fullName}</h2>
                    <p className="user-email-sub">{formData.email}</p>
                    <div className="role-badge"><ShieldIcon /> Employee</div>
                    <div className="meta-info">
                      <div className="meta-item"><CalendarIcon /> Joined Jan 2024</div>
                      <div className="meta-item"><IdIcon /> {formData.email}</div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="profile-right">
                  <div className="info-section-card">
                    <div className="section-header">
                      <h3>Personal Information</h3>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {isEditing && <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>}
                        <button className={`edit-btn ${isEditing ? 'saving' : ''}`} onClick={handleSaveProfile}>
                          {isEditing ? <><SaveIcon /> Save Changes</> : <><PencilIcon /> Edit Profile</>}
                        </button>
                      </div>
                    </div>

                    <div className="personal-info-grid">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input name="fullName" value={formData.fullName} onChange={handleChange} disabled={!isEditing} className={`form-input-box ${errors.fullName ? 'error' : ''}`} />
                        {errors.fullName && <div className="error-message"><AlertIcon /> {errors.fullName}</div>}
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} className={`form-input-box ${errors.phone ? 'error' : ''}`} />
                        {errors.phone && <div className="error-message"><AlertIcon /> {errors.phone}</div>}
                      </div>
                      <div className="form-group full-width">
                        <label>Email Address</label>
                        <input name="email" value={formData.email} onChange={handleChange} disabled={!isEditing} className={`form-input-box ${errors.email ? 'error' : ''}`} />
                        {errors.email && <div className="error-message"><AlertIcon /> {errors.email}</div>}
                      </div>
                    </div>
                  </div>

                  <div className="bottom-sections-flex">
                    {/* Preferences */}
                    <div className="info-section-card flex-1">
                      <h3>Preferences</h3>
                      <div className="preference-row">
                        <div className="pref-text"><h4>Email Notifications</h4><p>Receive alerts via email</p></div>
                        <label className="switch"><input type="checkbox" checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} /><span className="slider"></span></label>
                      </div>
                      <div className="preference-row">
                        <div className="pref-text"><h4>Push Notifications</h4><p>Receive alerts in browser</p></div>
                        <label className="switch"><input type="checkbox" checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} /><span className="slider"></span></label>
                      </div>
                    </div>

                    {/* Security */}
                    <div className="info-section-card flex-1">
                      <h3>Security</h3>
                      {!isChangingPassword ? (
                        <div className="security-action" onClick={() => setIsChangingPassword(true)}><LockIcon /><span>Change Password</span></div>
                      ) : (
                        <div className="password-form-container">
                          <input type={showPassword ? "text" : "password"} name="current" placeholder="Current Password" value={passwordData.current} onChange={(e) => setPasswordData({...passwordData, current: e.target.value})} className="form-input-box" />
                          <input type={showPassword ? "text" : "password"} name="new" placeholder="New Password" value={passwordData.new} onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} className="form-input-box" />
                          <input type={showPassword ? "text" : "password"} name="confirm" placeholder="Confirm Password" value={passwordData.confirm} onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} className="form-input-box" />
                          
                          <div className="show-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />} {showPassword ? "Hide" : "Show"} Passwords
                          </div>

                          {validationMsg && <div className={`validation-box ${validationMsg.type}`}>{validationMsg.text}</div>}

                          <div style={{display: 'flex', gap: '8px'}}>
                            <button className="edit-btn saving" onClick={handleSavePassword} style={{flex:1}}>Update</button>
                            <button className="cancel-btn" onClick={() => setIsChangingPassword(false)} style={{flex:1}}>Back</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        };

        export default Profile;