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
                <p>By creating an account and using Automatic Garbage Sorting System services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>
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
                <p>Hardware comes with manufacturer warranty as specified in your package. We are not liable for Bin damages resulting from sensor malfunction, incorrect data interpretation, or force majeure events.</p>
              </div>
              <div className="terms-section">
                <h4>7. Payment Terms</h4>
                <p>All hardware purchases are one-time payments. Subscription fees (if applicable) are billed monthly or annually. Refunds are available within 30 days of purchase for unused hardware in original condition.</p>
              </div>
              <div className="terms-section">
                <h4>8. Changes to Terms</h4>
                <p>We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the modified terms.</p>
              </div>
            </div>
          </div>

          <div className="terms-card">
            <h3 className="terms-card-title">Privacy Policy</h3>
            <div className="terms-card-content">
              <div className="terms-section">
                <h4>1. Information We Collect</h4>
                <p>We collect information you provide directly to us, including your first name, middle name, last name, email address, phone number, and complete address (region, province, city/municipality, barangay, and street address). We also collect data related to your role, account status, and activities within the Automatic Garbage Sorting System.</p>
              </div>
              <div className="terms-section">
                <h4>2. How We Use Your Information</h4>
                <p>We use the information we collect to:</p>
                <ul>
                  <li>Provide, maintain, and improve our services</li>
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
                <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
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
                <p>For privacy-related questions or to exercise your rights, contact us at karlandreiroyo86@gmail.com.</p>
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
