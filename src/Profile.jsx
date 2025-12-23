import React, { useState } from 'react';

// --- ICONS ---
const CameraIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const ShieldIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const CalendarIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IdIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><path d="M16 2v4"></path><path d="M8 2v4"></path><path d="M3 10h18"></path></svg>;
const PencilIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const SaveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const BellIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const LockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;

const Profile = () => {
  // --- STATE FOR EDITING ---
  const [isEditing, setIsEditing] = useState(false);
  
  // --- STATE FOR FORM VALUES ---
  const [formData, setFormData] = useState({
    fullName: 'Employee User',
    email: 'employee@ecosort.com',
    phone: '0912 345 6789'
  });

  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  // Handle Typing
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <style>{`
        .profile-container { max-width: 1100px; margin: 0 auto; padding: 20px 40px; font-family: 'Segoe UI', sans-serif; color: #333; }
        .profile-header h1 { font-size: 1.8rem; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0; }
        .profile-header p { color: #666; font-size: 0.95rem; margin-bottom: 40px; }

        .profile-content { display: flex; gap: 60px; }
        
        /* LEFT SIDE */
        .profile-left { width: 300px; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .avatar-wrapper { position: relative; margin-bottom: 20px; }
        .avatar-circle { width: 100px; height: 100px; background-color: #2bd687; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; color: white; }
        .camera-btn { position: absolute; bottom: 0; right: 0; background: #9ca3af; color: white; border: 2px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .user-name { font-size: 1.2rem; font-weight: 700; color: #111; margin: 0 0 4px 0; }
        .user-email-sub { font-size: 0.9rem; color: #666; margin-bottom: 12px; }
        .role-badge { display: inline-flex; align-items: center; gap: 6px; background: #e0f2f1; color: #00695c; padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 30px; }
        .meta-info { display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%; }
        .meta-item { display: flex; align-items: center; gap: 10px; color: #666; font-size: 0.9rem; }

        /* RIGHT SIDE */
        .profile-right { flex: 1; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .section-header h3 { font-size: 1rem; font-weight: 700; color: #111; margin: 0; }
        
        /* Edit Button Logic */
        .edit-btn { display: flex; align-items: center; gap: 6px; color: #008751; background: none; border: none; font-weight: 600; cursor: pointer; font-size: 0.9rem; padding: 5px 10px; border-radius: 4px; transition: 0.2s; }
        .edit-btn:hover { background-color: #e8f5e9; }
        .edit-btn.saving { color: #1976d2; }
        
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; font-size: 0.85rem; color: #555; margin-bottom: 8px; font-weight: 500; }
        
        /* TYPABLE INPUTS STYLING */
        .form-input-box { 
          width: 100%; 
          background: #f9fafb; 
          border: 1px solid #eee; 
          padding: 12px 16px; 
          border-radius: 8px; 
          color: #444; 
          font-size: 0.95rem; 
          font-family: inherit;
          transition: all 0.2s ease;
        }
        
        /* When Edit Mode is Active */
        .form-input-box:enabled {
          background: #ffffff;
          border-color: #008751;
          box-shadow: 0 0 0 3px rgba(0, 135, 81, 0.1);
          color: #111;
        }
        
        .form-input-box:disabled {
          cursor: default;
          opacity: 0.9;
        }

        .settings-section { margin-top: 40px; }
        .preference-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #f0f0f0; }
        .pref-info { display: flex; align-items: flex-start; gap: 12px; }
        .pref-text h4 { margin: 0 0 4px 0; font-size: 0.95rem; color: #333; }
        .pref-text p { margin: 0; font-size: 0.85rem; color: #888; }

        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #008751; }
        input:checked + .slider:before { transform: translateX(20px); }

        .security-action { display: flex; align-items: center; gap: 12px; padding: 16px 0; cursor: pointer; color: #333; transition: 0.2s; }
        .security-action:hover { color: #008751; }
        .security-action span { font-weight: 500; font-size: 0.95rem; }
      `}</style>

      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile Settings</h1>
          <p>Manage your account information and preferences</p>
        </div>

        <div className="profile-content">
          {/* Left Column */}
          <div className="profile-left">
            <div className="avatar-wrapper">
              <div className="avatar-circle">{formData.fullName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</div>
              <div className="camera-btn"><CameraIcon /></div>
            </div>
            
            <h2 className="user-name">{formData.fullName}</h2>
            <p className="user-email-sub">{formData.email}</p>
            
            <div className="role-badge">
              <ShieldIcon /> Employee
            </div>

            <div className="meta-info">
              <div className="meta-item"><CalendarIcon /> Joined January 15, 2024</div>
              <div className="meta-item"><IdIcon /> {formData.email}</div>
            </div>
          </div>

          {/* Right Column */}
          <div className="profile-right">
            
            {/* Personal Info */}
            <div className="section-header">
              <h3>Personal Information</h3>
              {/* Toggle Edit Mode Button */}
              <button 
                className={`edit-btn ${isEditing ? 'saving' : ''}`} 
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <><SaveIcon /> Save</> : <><PencilIcon /> Edit</>}
              </button>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="fullName"
                className="form-input-box"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing} 
              />
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email"
                className="form-input-box"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing} 
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                className="form-input-box"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing} 
              />
            </div>

            {/* Preferences */}
            <div className="settings-section">
              <h3>Preferences</h3>
              
              <div className="preference-row">
                <div className="pref-info">
                  <BellIcon />
                  <div className="pref-text">
                    <h4>Email Notifications</h4>
                    <p>Receive alerts via email</p>
                  </div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="preference-row">
                <div className="pref-info">
                  <BellIcon />
                  <div className="pref-text">
                    <h4>Push Notifications</h4>
                    <p>Receive alerts in browser</p>
                  </div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={pushNotif} onChange={() => setPushNotif(!pushNotif)} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            {/* Security */}
            <div className="settings-section">
              <h3>Security</h3>
              <div className="security-action">
                <LockIcon />
                <span>Change Password</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;