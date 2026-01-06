import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient.jsx';
import '../employee/employeecss/Profile.css';

// --- ICONS (Simplified for code clarity) ---
const ShieldIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const PencilIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const SaveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });

  // 1. Fetch User Data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const emailFromStorage = localStorage.getItem('userEmail');
      
      if (!emailFromStorage) throw new Error("No user email found in localStorage");

      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, email, contact')
        .eq('email', emailFromStorage)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          email: data.email || '',
          phone: data.contact || ''
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

  // 2. Handle Save to Database
  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      // Split name: first word is first_name, rest is last_name
      const nameParts = formData.fullName.trim().split(' ');
      const fName = nameParts[0];
      const lName = nameParts.slice(1).join(' ');

      const { error } = await supabase
        .from('users')
        .update({
          first_name: fName,
          last_name: lName,
          contact: formData.phone,
          email: formData.email
        })
        .eq('email', localStorage.getItem('userEmail')); // Always target based on original login email

      if (error) throw error;

      // Sync local storage
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userName', formData.fullName);

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        {saveSuccess && <div className="success-message">Changes saved successfully!</div>}
      </div>

      <div className="profile-content" style={{ display: 'flex', gap: '30px' }}>
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
        <div className="profile-right" style={{ flex: 1 }}>
          <div className="info-section-card">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Personal Information</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {isEditing && (
                  <button className="cancel-btn" onClick={() => { setIsEditing(false); fetchProfile(); }}>
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
                  className="form-input-box"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  className="form-input-box"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  className="form-input-box"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;