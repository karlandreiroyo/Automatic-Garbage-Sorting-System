import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forgot.css';

const Forgot = () => {
  const [step, setStep] = useState('forgot'); // forgot | confirm
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [code, setCode] = useState('');
  const [showToast, setShowToast] = useState(false);

  const navigate = useNavigate();

  const sendCode = () => {
    if (!emailOrMobile.trim()) return;

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setStep('confirm');
    }, 1500);
  };

  const confirmCode = () => {
    if (!code.trim()) return;
    alert('Account successfully confirmed!');
    navigate('/login'); // ✅ balik login
  };

  const cancel = () => {
    navigate('/login'); // ✅ balik login
  };

  return (
    <div className="forgot-container">
      {showToast && <div className="toast">Code successfully sent</div>}

      {step === 'forgot' && (
        <div className="forgot-box">
          <button className="close-btn" onClick={cancel}>✕</button>

          <h2>Reset Password</h2>
          <p className="subtitle">
            Enter your mobile number or email
          </p>

          <input
            type="text"
            placeholder="Mobile number or email"
            value={emailOrMobile}
            onChange={(e) => setEmailOrMobile(e.target.value)}
          />

          <div className="btn-group">
            <button className="btn cancel" onClick={cancel}>
              Cancel
            </button>
            <button className="btn primary" onClick={sendCode}>
              Send Verification
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="forgot-box">
          <button className="close-btn" onClick={cancel}>✕</button>

          <h2>Confirm your account</h2>
          <p className="subtitle">
            Enter the code sent to your email or mobile
          </p>

          <input
            type="text"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <button className="btn primary full" onClick={confirmCode}>
            Continue
          </button>

          <button className="btn link">
            Didn’t get a code?
          </button>
        </div>
      )}
    </div>
  );
};

export default Forgot;
