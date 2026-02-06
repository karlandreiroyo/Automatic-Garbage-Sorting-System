import React, { useState, useEffect } from 'react';
import '../employee/employeecss/Profile.css';

/**
 * Reusable Terms and Conditions & Privacy Policy modal.
 * Used for first-login (collector) and Profile save.
 * Props: open (boolean), onAccept (fn), onCancel (fn)
 */
const TermsAndConditionsModal = ({ open, onAccept, onCancel }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  useEffect(() => {
    if (!open) setHasScrolledToBottom(false);
  }, [open]);

  if (!open) return null;

  return (
    <div className="terms-modal-overlay" onClick={onCancel}>
      <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal-header">
          <h2>Terms and Conditions & Privacy Policy</h2>
          <button className="terms-close-btn" onClick={onCancel} type="button">×</button>
        </div>

        <div
          className="terms-modal-body"
          onScroll={(e) => {
            const element = e.target;
            const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
            setHasScrolledToBottom(isAtBottom);
          }}
        >
          <div className="terms-card">
            <h3 className="terms-card-title">Terms and Conditions</h3>
            <div className="terms-card-content">
              <div className="terms-section">
                <h4>1. Acceptance of Terms</h4>
                <p>By accessing and using the Automatic Garbage Sorting System, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the system.</p>
              </div>
              <div className="terms-section">
                <h4>2. Account Responsibilities</h4>
                <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information and notify administrators of any unauthorized access immediately.</p>
              </div>
              <div className="terms-section">
                <h4>3. System Usage</h4>
                <ul>
                  <li>Use the system only for authorized waste collection and sorting activities</li>
                  <li>Do not share your account credentials with others</li>
                  <li>Report any system malfunctions or bin issues promptly</li>
                  <li>Follow proper waste sorting procedures and guidelines</li>
                </ul>
              </div>
              <div className="terms-section">
                <h4>4. Data Collection</h4>
                <p>The system collects data related to waste collection, bin monitoring, and your work activities. This data is used to improve services and track collection efficiency.</p>
              </div>
              <div className="terms-section">
                <h4>5. System Availability</h4>
                <p>While we strive for reliable service, the system may experience temporary downtime for maintenance. We are not liable for service interruptions beyond our control.</p>
              </div>
              <div className="terms-section">
                <h4>6. Compliance</h4>
                <p>You must comply with all applicable environmental regulations and waste management policies while using this system.</p>
              </div>
            </div>
          </div>

          <div className="terms-card">
            <h3 className="terms-card-title">Privacy Policy</h3>
            <div className="terms-card-content">
              <div className="terms-section">
                <h4>1. Information We Collect</h4>
                <p>We collect your personal information (name, email, contact details, address) and work-related data (collection history, bin monitoring records, activity logs) to provide and improve our services.</p>
              </div>
              <div className="terms-section">
                <h4>2. How We Use Your Information</h4>
                <p>Your information is used to:</p>
                <ul>
                  <li>Manage your account and provide system access</li>
                  <li>Track waste collection activities and bin status</li>
                  <li>Generate reports and analytics for waste management</li>
                  <li>Send important notifications and updates</li>
                </ul>
              </div>
              <div className="terms-section">
                <h4>3. Data Security</h4>
                <p>We implement security measures to protect your personal information. All data is encrypted and stored securely. We do not sell your personal information to third parties.</p>
              </div>
              <div className="terms-section">
                <h4>4. Data Retention</h4>
                <p>We retain your personal information and work data for as long as necessary to provide services and comply with legal obligations. Collection history is retained for reporting and analysis purposes.</p>
              </div>
              <div className="terms-section">
                <h4>5. Your Rights</h4>
                <p>You have the right to access, correct, or request deletion of your personal information. Contact your administrator or email karlandreiroyo86@gmail.com for assistance.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="terms-modal-footer">
          <button type="button" className="terms-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="terms-accept-btn"
            onClick={onAccept}
            disabled={!hasScrolledToBottom}
          >
            Done / Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;
