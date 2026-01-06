import React, { useState } from 'react';
<<<<<<< HEAD
import { createPortal } from 'react-dom';
import '../employee/employeecss/Profile.css'; 

// --- ICONS ---
const CameraIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2-2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
=======
import '../employee/employeecss/Profile.css'; // separate CSS file

// --- ICONS (Stay exactly the same) ---
const CameraIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
const ShieldIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const CalendarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IdIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h18"></path></svg>;
const PencilIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const SaveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
<<<<<<< HEAD
const BellIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const LockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const CloseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
=======
const BellIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const LockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: 'Employee User', email: 'employee@ecosort.com', phone: '0912 345 6789' });
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
<<<<<<< HEAD
  
  const [showModal, setShowModal] = useState(false);
  // NEW STATE: Global Toggle Password Visibility
  const [showPassword, setShowPassword] = useState(false);
=======
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

<<<<<<< HEAD
  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setShowModal(false);
    setShowPassword(false); 
    setTimeout(() => alert("Success: Password updated successfully!"), 300); 
  };

  const openModal = () => {
    setShowPassword(false); // Reset to hidden when opening
    setShowModal(true);
  };

=======
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div className="profile-content">
        {/* LEFT CARD */}
        <div className="profile-left">
          <div className="left-card-inner">
            <div className="avatar-wrapper">
              <div className="avatar-circle">{formData.fullName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>
              <div className="camera-btn"><CameraIcon /></div>
            </div>
            <h2 className="user-name">{formData.fullName}</h2>
            <p className="user-email-sub">{formData.email}</p>
            <div className="role-badge"><ShieldIcon /> Employee</div>
            <div className="meta-info">
              <div className="meta-item"><CalendarIcon /> Joined January 15, 2024</div>
              <div className="meta-item"><IdIcon /> {formData.email}</div>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* RIGHT CONTENT */}
        <div className="profile-right">
=======
        {/* RIGHT CONTENT (Occupies more space) */}
        <div className="profile-right">
          {/* Personal Info */}
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
          <div className="info-section-card">
            <div className="section-header">
              <h3>Personal Information</h3>
              <button className={`edit-btn ${isEditing ? 'saving' : ''}`} onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? <><SaveIcon /> Save Changes</> : <><PencilIcon /> Edit Profile</>}
              </button>
            </div>
<<<<<<< HEAD
=======

>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
            <div className="personal-info-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="form-input-box" disabled={!isEditing} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="form-input-box" disabled={!isEditing} />
              </div>
              <div className="form-group full-width">
                <label>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input-box" disabled={!isEditing} />
              </div>
            </div>
          </div>

          <div className="bottom-sections-flex">
<<<<<<< HEAD
=======
            {/* Preferences */}
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
            <div className="info-section-card flex-1">
              <h3>Preferences</h3>
              <div className="preference-row">
                <div className="pref-info"><BellIcon /><div className="pref-text"><h4>Email Notifications</h4><p>Receive alerts via email</p></div></div>
                <label className="switch"><input type="checkbox" checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} /><span className="slider"></span></label>
              </div>
              <div className="preference-row">
                <div className="pref-info"><BellIcon /><div className="pref-text"><h4>Push Notifications</h4><p>Receive alerts in browser</p></div></div>
                <label className="switch"><input type="checkbox" checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} /><span className="slider"></span></label>
              </div>
            </div>

<<<<<<< HEAD
            <div className="info-section-card flex-1">
              <h3>Security</h3>
              <p className="security-text">Update your password regularly to keep your account secure.</p>
              <div className="security-action" onClick={openModal}>
                <LockIcon /><span>Change Password</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PASSWORD MODAL --- */}
      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><CloseIcon/></button>
            </div>
            <form onSubmit={handlePasswordUpdate}>
              
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="form-input-box" 
                  placeholder="••••••••" 
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="form-input-box" 
                  placeholder="••••••••" 
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="form-input-box" 
                  placeholder="••••••••" 
                />
              </div>

              {/* SINGLE BUTTON/CHECKBOX TO SHOW PASSWORD */}
              <div className="show-password-option">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={showPassword} 
                    onChange={() => setShowPassword(!showPassword)} 
                  />
                  <span>Show Password</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="save-btn">Update Password</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
=======
            {/* Security */}
            <div className="info-section-card flex-1">
              <h3>Security</h3>
              <p style={{fontSize: '0.85rem', color: '#666', marginBottom: '15px'}}>Update your password regularly to keep your account secure.</p>
              <div className="security-action"><LockIcon /><span>Change Password</span></div>
            </div>
          </div>

        </div>
      </div>
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
    </div>
  );
};

export default Profile;