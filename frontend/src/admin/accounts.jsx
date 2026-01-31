import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/accounts.css';
import AddressDropdowns from '../components/AddressDropdowns';

// --- Icons ---
const AddIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>;
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const CancelIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const SaveIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const ArchiveIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
const ActivateIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const AlertIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Accounts = () => { 
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editTouched, setEditTouched] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isNotificationHiding, setIsNotificationHiding] = useState(false);
  
  // Verify state for Add Employee (email verification)
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null); // Store password generated during verification
  
  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToConfirm, setUserToConfirm] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Save changes confirmation modal states
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState(null);
  
  // Create account confirmation modal states
  const [showCreateConfirmModal, setShowCreateConfirmModal] = useState(false);
  const [pendingCreateData, setPendingCreateData] = useState(null);
  
  // Alert/Error modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('Alert');
  
  // Credentials-sent modal (after Create Account)
  const [showCredentialsSentModal, setShowCredentialsSentModal] = useState(false);
  const [lastCreatedEmail, setLastCreatedEmail] = useState('');
  const [credentialsSentToEmail, setCredentialsSentToEmail] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const [formData, setFormData] = useState({
    email: '',
    backup_email: '',
    role: 'COLLECTOR',
    assigned_bin_id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    address: {
      region: '',
      province: '',
      city_municipality: '',
      barangay: '',
      street_address: ''
    }
  });

  const [bins, setBins] = useState([]);
  const [editAssignedBinId, setEditAssignedBinId] = useState('');
  const [binSelectOpen, setBinSelectOpen] = useState(false);
  const [binSearchQuery, setBinSearchQuery] = useState('');
  const binDropdownRef = useRef(null);
  const binSearchInputRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchBins = async () => {
    try {
      const { data, error } = await supabase
        .from('bins')
        .select('id, name, location, assigned_collector_id')
        .eq('status', 'ACTIVE')
        .order('name', { ascending: true });
      if (error) throw error;
      setBins(data || []);
    } catch (err) {
      console.error('Error fetching bins:', err);
      setBins([]);
    }
  };

  useEffect(() => {
    if (showAddModal) {
      setEmailVerified(false);
      setGeneratedPassword(null);
      fetchBins();
    }
  }, [showAddModal]);

  useEffect(() => {
    if (editingUser) fetchBins();
  }, [editingUser]);

  useEffect(() => {
    if (editingUser && bins.length >= 0) {
      const currentBin = bins.find(b => b.assigned_collector_id === editingUser.id);
      setEditAssignedBinId(currentBin ? String(currentBin.id) : '');
    }
  }, [editingUser, bins]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (editingUser || showAddModal || showSaveConfirmModal || showCreateConfirmModal || showConfirmModal || showCredentialsSentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingUser, showAddModal, showSaveConfirmModal, showCreateConfirmModal, showConfirmModal, showCredentialsSentModal]);

  // Assign Bin dropdown: close on click outside, clear search when opening
  useEffect(() => {
    if (!binSelectOpen) return;
    setBinSearchQuery('');
    const handleClickOutside = (e) => {
      if (binDropdownRef.current && !binDropdownRef.current.contains(e.target)) {
        setBinSelectOpen(false);
        setBinSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [binSelectOpen]);

  useEffect(() => {
    if (binSelectOpen) {
      const t = setTimeout(() => binSearchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [binSelectOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      setAlertTitle('Error');
      setAlertMessage('Error fetching users: ' + error.message);
      setShowAlertModal(true);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setIsNotificationHiding(false);

    setTimeout(() => {
      setIsNotificationHiding(true);
      setTimeout(() => {
        setShowNotification(false);
        setIsNotificationHiding(false);
      }, 300);
    }, 3000);
  };

  const closeNotification = () => {
    setIsNotificationHiding(true);
    setTimeout(() => {
      setShowNotification(false);
      setIsNotificationHiding(false);
    }, 300);
  };

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'INACTIVE' ? 'archive' : 'activate';
    
    setUserToConfirm(user);
    setConfirmAction(() => async () => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('users')
          .update({ status: newStatus })
          .eq('id', user.id);

        if (error) throw error;

        // ADD ACTIVITY LOGGING HERE
        const actionText = newStatus === 'INACTIVE' ? 'archived' : 'activated';
        await supabase.from('activity_logs').insert([{
          activity_type: newStatus === 'INACTIVE' ? 'USER_ARCHIVED' : 'USER_ACTIVATED',
          description: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${user.first_name} ${user.last_name}`,
          user_id: user.id
        }]);
        
        setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        setShowConfirmModal(false);
        setUserToConfirm(null);
        setConfirmAction(null);
        showSuccessNotification(`Employee ${actionLabel}d successfully!`);
      } catch (error) {
        setAlertTitle('Error');
        setAlertMessage('Error: ' + error.message);
        setShowAlertModal(true);
      } finally {
        setLoading(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setUserToConfirm(null);
    setConfirmAction(null);
  };

  const openEditModal = (user) => {
    setEditingUser({ ...user });
    setEditErrors({});
    setEditTouched({});
  };

  const validateField = (name, value) => {
    let error = '';
    switch(name) {
      case 'first_name':
        if (!value.trim()) error = 'First name is required';
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Numbers and special characters are not allowed';
        else if (value.trim().length < 2) error = 'Must be at least 2 characters';
        break;
      case 'last_name':
        if (!value.trim()) error = 'Last name is required';
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Numbers and special characters are not allowed';
        else if (value.trim().length < 2) error = 'Must be at least 2 characters';
        break;
      case 'middle_name':
        // Middle name is optional, but if provided, must be valid
        if (value && value.trim().length > 0) {
          if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Numbers and special characters are not allowed';
          else if (value.trim().length < 2) error = 'Must be at least 2 characters';
        }
        break;
      case 'backup_email': {
        // Optional email; if provided, must be valid email format
        if (value && value.trim()) {
          const emailVal = value.trim();
          const atCount = (emailVal.match(/@/g) || []).length;
          const emailRegex = /^[a-zA-Z0-9.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

          if (atCount === 0) {
            error = 'You need to put @';
          } else if (atCount > 1) {
            error = 'Email must contain exactly one @ symbol';
          } else if (atCount === 1) {
            if (emailVal.endsWith('@') || emailVal.endsWith('.')) {
              error = 'Email cannot end with @ or a period';
            } else if (!emailRegex.test(emailVal)) {
              error = 'Invalid domain format (e.g., .com, .ph)';
            }
          }
        }
        break;
      }
      case 'email': {
        const emailVal = value.trim();
        const atCount = (emailVal.match(/@/g) || []).length;
        const emailRegex = /^[a-zA-Z0-9.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!emailVal) {
          error = 'Email is required';
        } else if (atCount === 0) {
          error = 'You need to put @';
        } else if (atCount > 1) {
          error = 'Email must contain exactly one @ symbol';
        } else if (atCount === 1) {
          // If there is exactly one @, check for valid domain structure
          if (emailVal.endsWith('@') || emailVal.endsWith('.')) {
            error = 'Email cannot end with @ or a period';
          } else if (!emailRegex.test(emailVal)) {
            error = 'Invalid domain format (e.g., .com, .ph)';
          }
        }
        break;
      }
      case 'role':
        if (!value) error = 'Please select an account role';
        break;
      case 'assigned_bin_id':
        if (!value || !String(value).trim()) error = 'Please select a bin to assign';
        break;
      case 'region':
        if (!value) error = 'Region is required';
        break;
      case 'province':
        if (!value) error = 'Province is required';
        break;
      case 'city_municipality':
        if (!value) error = 'City/Municipality is required';
        break;
      case 'barangay':
        if (!value) error = 'Barangay is required';
        break;
      default: 
      break;
    }
    return error;
  };

  // Validate address fields
  const validateAddress = () => {
    const addressErrors = {};
    if (!formData.address.region) {
      addressErrors.region = 'Region is required';
    }
    if (!formData.address.province) {
      addressErrors.province = 'Province is required';
    }
    if (!formData.address.city_municipality) {
      addressErrors.city_municipality = 'City/Municipality is required';
    }
    if (!formData.address.barangay) {
      addressErrors.barangay = 'Barangay is required';
    }
    return addressErrors;
  };

  const validateEditField = (name, value) => {
    let error = '';
    switch(name) {
      case 'first_name':
        if (!value.trim()) error = 'First name is required';
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Numbers and special characters are not allowed';
        else if (value.trim().length < 2) error = 'Must be at least 2 characters';
        break;
      case 'last_name':
        if (!value.trim()) error = 'Last name is required';
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Numbers and special characters are not allowed';
        else if (value.trim().length < 2) error = 'Must be at least 2 characters';
        break;
      case 'middle_name':
        if (value && value.trim().length > 0) {
          if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Numbers and special characters are not allowed';
          else if (value.trim().length < 2) error = 'Must be at least 2 characters';
        }
        break;
      case 'contact': {
        const contactStr = String(value || '');
        const digitsOnly = contactStr.replace(/[^0-9]/g, '');
        if (digitsOnly.length > 0) {
          if (digitsOnly.length < 11) error = `Remaining ${11 - digitsOnly.length} digits required`;
          else if (!digitsOnly.startsWith('09')) error = 'Contact number must start with 09';
        }
        break;
      }
      default: break;
    }
    return error;
  };

  const generateDefaultPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()';
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (['first_name', 'last_name', 'middle_name'].includes(name)) {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
    }

    // Backup email: normalize email format
    if (name === 'backup_email') {
      let cleaned = value.trim().toLowerCase();
      // Remove multiple @ symbols (keep only first one)
      const parts = cleaned.split('@');
      if (parts.length > 2) {
        cleaned = parts[0] + '@' + parts.slice(1).join('');
      }
      finalValue = cleaned;
    }
    
    // Email Real-time cleaning
    if (name === 'email') {
      // 1. Remove invalid characters
      let cleaned = value.replace(/[^a-zA-Z0-9@.]/g, '').toLowerCase();
      
      // 2. Prevent multiple '@' symbols as they type
      const parts = cleaned.split('@');
      if (parts.length > 2) {
        cleaned = parts[0] + '@' + parts.slice(1).join('');
      }
      finalValue = cleaned;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, finalValue) }));
    if (name === 'email') {
      setEmailVerified(false);
      setGeneratedPassword(null); // Clear password if email changes
    }
    if (['first_name', 'last_name'].includes(name)) {
      setGeneratedPassword(null); // Clear password if name changes (password is based on name)
      setEmailVerified(false); // Re-verify email to send new password
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Keep names Uppercase and letters only
    if (['first_name', 'last_name', 'middle_name'].includes(name)) {
      finalValue = value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
    }

    // Contact: digits only, must start with 09, max 11 digits
    if (name === 'contact') {
      let digits = value.replace(/\D/g, '');
      if (digits.length && !digits.startsWith('09')) {
        if (digits.startsWith('9')) digits = '0' + digits;
        else digits = '09' + digits;
      }
      finalValue = digits.slice(0, 11);
    }

    setEditingUser(prev => ({ ...prev, [name]: finalValue }));
    setEditTouched(prev => ({ ...prev, [name]: true }));
    setEditErrors(prev => ({ ...prev, [name]: validateEditField(name, finalValue) }));
  };

  const handleEditBlur = (e) => {
    const { name, value } = e.target;
    setEditTouched(prev => ({ ...prev, [name]: true }));
    setEditErrors(prev => ({ ...prev, [name]: validateEditField(name, value) }));
  };

  const handleVerifyEmail = async () => {
    const emailErr = validateField('email', formData.email);
    if (emailErr) {
      setErrors(prev => ({ ...prev, email: emailErr }));
      setTouched(prev => ({ ...prev, email: true }));
      return;
    }
    
    // Check if first_name and last_name are filled (needed to generate password)
    if (!formData.first_name || !formData.last_name) {
      setAlertTitle('Name Required');
      setAlertMessage('Please fill in First Name and Last Name before verifying email. These are needed to generate the password.');
      setShowAlertModal(true);
      return;
    }
    
    setVerifyingEmail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email.trim(),
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setEmailVerified(true);
        if (data.password) {
          setGeneratedPassword(data.password);
        }
        const msg = data.emailSent 
          ? 'Email verified and credentials sent! Check the employee\'s email inbox.'
          : data.message || 'Email verified successfully.';
        showSuccessNotification(msg);
        if (data.emailError) {
          setAlertTitle('Email Sent with Warning');
          setAlertMessage(`Email verified, but sending credentials failed: ${data.emailError}`);
          setShowAlertModal(true);
        }
      } else {
        setAlertTitle('Email Verification Failed');
        setAlertMessage(data.message || 'Could not verify email. Please check and try again.');
        setShowAlertModal(true);
      }
    } catch (err) {
      setAlertTitle('Error');
      setAlertMessage(err.message || 'Email verification failed. Please try again.');
      setShowAlertModal(true);
    } finally {
      setVerifyingEmail(false);
    }
  };


  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!emailVerified) {
      setAlertTitle('Verification Required');
      setAlertMessage('Please verify the email address before creating the account.');
      setShowAlertModal(true);
      return;
    }
    const newErrors = {};
    ['first_name', 'last_name', 'email', 'role', 'assigned_bin_id'].forEach(f => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    // Validate backup email if provided (optional)
    if (formData.backup_email && formData.backup_email.trim()) {
      const backupEmailErr = validateField('backup_email', formData.backup_email);
      if (backupEmailErr) newErrors.backup_email = backupEmailErr;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ first_name: true, last_name: true, email: true, middle_name: true, role: true, assigned_bin_id: true });
      return;
    }
    setPendingCreateData({ ...formData });
    setShowCreateConfirmModal(true);
  };

  const handleCancelCreate = () => {
    setShowCreateConfirmModal(false);
    setPendingCreateData(null);
  };

const handleConfirmCreate = async () => {
  if (!pendingCreateData) return;
  try {
    setLoading(true);
    const res = await fetch(`${API_BASE_URL}/api/accounts/create-employee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: pendingCreateData.first_name,
        last_name: pendingCreateData.last_name,
        middle_name: pendingCreateData.middle_name || '',
        email: pendingCreateData.email,
        backup_email: pendingCreateData.backup_email || '',
        role: 'COLLECTOR',
        password: generatedPassword, // Use password from verification
        region: pendingCreateData.address?.region || '',
        province: pendingCreateData.address?.province || '',
        city_municipality: pendingCreateData.address?.city_municipality || '',
        barangay: pendingCreateData.address?.barangay || '',
        street_address: pendingCreateData.address?.street_address || ''
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      setAlertTitle('Error');
      setAlertMessage(data.message || 'Failed to create employee. Please try again.');
      setShowAlertModal(true);
      return;
    }
    setLastCreatedEmail(pendingCreateData.email.trim().toLowerCase());
    setCredentialsSentToEmail(Boolean(data.sentToEmail));
    setEmailError(data.emailError || '');
    setShowAddModal(false);
    setShowCreateConfirmModal(false);
    setPendingCreateData(null);
    if (pendingCreateData.assigned_bin_id) {
      const { data: newUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', pendingCreateData.email.trim().toLowerCase())
        .single();
      if (newUser) {
        await supabase
          .from('bins')
          .update({ assigned_collector_id: newUser.id })
          .eq('id', pendingCreateData.assigned_bin_id);
      }
    }
    setFormData({ 
      email: '', 
      backup_email: '',
      role: 'COLLECTOR', 
      assigned_bin_id: '',
      first_name: '', 
      last_name: '', 
      middle_name: '',
      address: {
        region: '',
        province: '',
        city_municipality: '',
        barangay: '',
        street_address: ''
      }
    });
    setErrors({});
    setTouched({});
    setEmailVerified(false);
    setGeneratedPassword(null);
    fetchUsers();
    setShowCredentialsSentModal(true);
  } catch (error) {
    setAlertTitle('Error');
    setAlertMessage(error.message || 'Failed to create employee. Please try again.');
    setShowAlertModal(true);
  } finally {
    setLoading(false);
  }
};

const handleCloseCredentialsSent = () => {
  setShowCredentialsSentModal(false);
  setLastCreatedEmail('');
  setCredentialsSentToEmail(false);
  setEmailError('');
};

const handleVerifyEmailSent = async () => {
  if (!lastCreatedEmail) return;
  setResendingEmail(true);
  try {
    const res = await fetch(`${API_BASE_URL}/api/accounts/resend-credentials-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lastCreatedEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
      showSuccessNotification('Credentials resent to email.');
    } else {
      setAlertTitle('Resend Failed');
      setAlertMessage(data.message || 'Could not resend to email.');
      setShowAlertModal(true);
    }
  } catch (err) {
    setAlertTitle('Error');
    setAlertMessage(err.message || 'Resend failed.');
    setShowAlertModal(true);
  } finally {
    setResendingEmail(false);
  }
};


const handleUpdateEmployee = async (e) => {
  e.preventDefault();

  const newErrors = {};
  ['first_name', 'last_name'].forEach(f => {
    const err = validateEditField(f, editingUser[f]);
    if (err) newErrors[f] = err;
  });

  if (editingUser.middle_name) {
    const err = validateEditField('middle_name', editingUser.middle_name);
    if (err) newErrors['middle_name'] = err;
  }

  if (editingUser.contact != null && String(editingUser.contact).replace(/\D/g, '').length > 0) {
    const err = validateEditField('contact', editingUser.contact);
    if (err) newErrors['contact'] = err;
  }

  if (Object.keys(newErrors).length > 0) {
    setEditErrors(newErrors);
    setEditTouched({ first_name: true, last_name: true, middle_name: true, contact: true });
    return;
  }

  // Show save confirmation modal (include assigned bin for update)
  setPendingSaveData({ ...editingUser, assigned_bin_id: editAssignedBinId });
  setShowSaveConfirmModal(true);
};

const handleConfirmSave = async () => {
  if (!pendingSaveData) return;

  try {
    setLoading(true);

    let contactValue = (pendingSaveData.contact ?? '').toString().replace(/\D/g, '');
    if (contactValue.length && !contactValue.startsWith('09')) {
      if (contactValue.startsWith('9')) contactValue = '0' + contactValue;
      else contactValue = '09' + contactValue;
    }
    contactValue = contactValue.slice(0, 11) || null;

    const { error } = await supabase
      .from('users')
      .update({
        first_name: pendingSaveData.first_name.trim(),
        last_name: pendingSaveData.last_name.trim(),
        middle_name: pendingSaveData.middle_name?.trim() || '',
        contact: contactValue,
        role: pendingSaveData.role
      })
      .eq('auth_id', pendingSaveData.auth_id);

    if (error) throw error;

    // Update bin assignment: unassign old bin(s) for this user, assign new bin if selected
    await supabase
      .from('bins')
      .update({ assigned_collector_id: null })
      .eq('assigned_collector_id', pendingSaveData.id);
    if (pendingSaveData.assigned_bin_id) {
      await supabase
        .from('bins')
        .update({ assigned_collector_id: pendingSaveData.id })
        .eq('id', pendingSaveData.assigned_bin_id);
    }

    // ADD ACTIVITY LOGGING HERE
    await supabase.from('activity_logs').insert([{
      activity_type: 'USER_UPDATED',
      description: `Updated ${pendingSaveData.first_name} ${pendingSaveData.last_name}'s information`,
      user_id: pendingSaveData.id
    }]);

    setEditingUser(null);
    setPendingSaveData(null);
    setShowSaveConfirmModal(false);
    setEditErrors({});
    setEditTouched({});
    await fetchUsers();
    showSuccessNotification('Employee updated successfully!');
  } catch (error) {
    console.error("Supabase Error:", error.message);
    setAlertTitle('Error');
    setAlertMessage('Error: ' + error.message);
    setShowAlertModal(true);
  } finally {
    setLoading(false);
  }
};

const handleCancelSave = () => {
  setShowSaveConfirmModal(false);
  setPendingSaveData(null);
};

  const getFullName = (user) => {
    const middle = user.middle_name ? ` ${user.middle_name} ` : ' ';
    return `${user.first_name}${middle}${user.last_name}`;
  };

  const filteredUsers = users.filter(user => {
    const fullName = getFullName(user).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  return (
    <div className="accounts-container">
      
      {/* Confirmation Modal */}
      {showConfirmModal && userToConfirm && (
        <div className="confirm-modal-overlay" onClick={handleCancelConfirm}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon">
              <AlertIcon />
            </div>
            <h3 className="confirm-modal-title">Confirm Action</h3>
            <p className="confirm-modal-message">
              Are you sure you want to {userToConfirm.status === 'ACTIVE' ? 'archive' : 'activate'} {userToConfirm.first_name}?
            </p>
            <div className="confirm-modal-actions">
              <button 
                className="confirm-btn-cancel" 
                onClick={handleCancelConfirm}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className={`confirm-btn-ok ${userToConfirm.status === 'ACTIVE' ? 'archive-confirm' : 'activate-confirm'}`}
                onClick={handleConfirmAction}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save Changes Confirmation Modal */}
      {showSaveConfirmModal && (
        <div className="confirm-modal-overlay" onClick={handleCancelSave}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon">
              <AlertIcon />
            </div>
            <h3 className="confirm-modal-title">Confirm Action</h3>
            <p className="confirm-modal-message">
              Are you sure you want to save these changes?
            </p>
            <div className="confirm-modal-actions">
              <button 
                className="confirm-btn-cancel" 
                onClick={handleCancelSave}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn-ok activate-confirm"
                onClick={handleConfirmSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Account Confirmation Modal */}
      {showCreateConfirmModal && (
        <div className="confirm-modal-overlay" onClick={handleCancelCreate}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon">
              <AlertIcon />
            </div>
            <h3 className="confirm-modal-title">Confirm Action</h3>
            <p className="confirm-modal-message">
              Are you sure you want to create this employee account?
            </p>
            <div className="confirm-modal-actions">
              <button 
                className="confirm-btn-cancel" 
                onClick={handleCancelCreate}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn-ok activate-confirm"
                onClick={handleConfirmCreate}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Credentials Sent Modal (after Create Account) */}
      {showCredentialsSentModal && (
        <div className="confirm-modal-overlay" onClick={handleCloseCredentialsSent}>
          <div className="credentials-sent-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="credentials-sent-title">Account Created</h3>
            <p className="credentials-sent-message">
              {credentialsSentToEmail && 'Credentials sent to email. Also check the terminal for username and password.'}
              {!credentialsSentToEmail && 'Account created. Email sending failed; check SMTP config. Check the terminal for username and password.'}
            </p>
            {emailError && (
              <div className="credentials-error-box">
                <strong>Email Error:</strong> {emailError}
              </div>
            )}
            <p className="credentials-sent-sub">Resend credentials if needed:</p>
            <div className="credentials-sent-buttons">
              <button
                type="button"
                className="credentials-verify-btn email"
                onClick={handleVerifyEmailSent}
                disabled={resendingEmail}
              >
                {resendingEmail ? 'Sending...' : 'Resend Email'}
              </button>
            </div>
            <button type="button" className="credentials-sent-close" onClick={handleCloseCredentialsSent}>
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Success Notification Toast */}
      {showNotification && (
        <div className={`notification-toast ${isNotificationHiding ? 'hiding' : ''}`}>
          <div className="notification-icon">✓</div>
          <div className="notification-content">
            <p className="notification-title">Success!</p>
            <p className="notification-message">{notificationMessage}</p>
          </div>
          <button className="notification-close" onClick={closeNotification}>×</button>
        </div>
      )}

      {/* --- ADD MODAL --- */}
      {showAddModal && !showCreateConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content maximized" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Collector</h2>
            </div>
            <form onSubmit={handleAddEmployee} className="employee-form">
              <div className="form-grid">
                <div className={`form-group ${errors.first_name ? 'has-error' : ''}`}>
                  <label>First Name *</label>
                  <input 
                    type="text" 
                    name="first_name" 
                    value={formData.first_name} 
                    onChange={handleInputChange} 
                    onBlur={handleBlur} 
                  />
                  {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                </div>
                <div className={`form-group ${errors.last_name ? 'has-error' : ''}`}>
                  <label>Last Name *</label>
                  <input 
                    type="text" 
                    name="last_name" 
                    value={formData.last_name} 
                    onChange={handleInputChange} 
                    onBlur={handleBlur} 
                  />
                  {errors.last_name && <span className="error-message">{errors.last_name}</span>}
                </div>
                <div className={`form-group ${errors.middle_name ? 'has-error' : ''}`}>
                  <label>Middle Name</label>
                  <input 
                    type="text" 
                    name="middle_name" 
                    value={formData.middle_name} 
                    onChange={handleInputChange} 
                    onBlur={handleBlur} 
                  />
                  {errors.middle_name && <span className="error-message">{errors.middle_name}</span>}
                </div>
                <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                  <label>Email Address *</label>
                  <div className="input-with-verify">
                    <input 
                      type="text" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      onBlur={handleBlur}
                    />
                    <button
                      type="button"
                      className={`verify-btn-inline email ${emailVerified ? 'verified' : ''}`}
                      onClick={handleVerifyEmail}
                      disabled={verifyingEmail || !formData.email.trim() || emailVerified}
                      title={emailVerified ? 'Email already verified' : 'Verify email'}
                    >
                      {verifyingEmail ? 'Verifying...' : emailVerified ? 'Verified ✓' : 'Verify'}
                    </button>
                    {emailVerified && <span className="verified-badge-inline">✓</span>}
                  </div>
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                <div className={`form-group ${errors.backup_email ? 'has-error' : ''}`}>
                  <label>Back up Email</label>
                  <input 
                    type="text" 
                    name="backup_email" 
                    value={formData.backup_email} 
                    onChange={handleInputChange} 
                    onBlur={handleBlur}
                    placeholder="Optional backup email address"
                  />
                  {errors.backup_email && <span className="error-message">{errors.backup_email}</span>}
                </div>
                <div className={`form-group ${errors.assigned_bin_id ? 'has-error' : ''}`}>
                  <label>Assign Bin *</label>
                  {(() => {
                    const q = binSearchQuery.trim().toLowerCase();
                    const filteredBinsAdd = q
                      ? bins.filter((bin) => {
                          const name = (bin.name || '').toLowerCase();
                          const location = (bin.location || '').toLowerCase();
                          const idStr = String(bin.id || '').toLowerCase();
                          return name.includes(q) || location.includes(q) || idStr.includes(q);
                        })
                      : bins;
                    return (
                  <div className="bin-select-wrapper" ref={binDropdownRef}>
                    <button
                      type="button"
                      className={`bin-select-trigger ${errors.assigned_bin_id && touched.assigned_bin_id ? 'error' : ''}`}
                      onClick={() => setBinSelectOpen((prev) => { if (prev) setBinSearchQuery(''); return !prev; })}
                      onBlur={() => setTouched((t) => ({ ...t, assigned_bin_id: true }))}
                      aria-expanded={binSelectOpen}
                      aria-haspopup="listbox"
                    >
                      <span className={!formData.assigned_bin_id ? 'placeholder' : ''}>
                        {formData.assigned_bin_id
                          ? (() => {
                              const sel = bins.find((b) => b.id === formData.assigned_bin_id);
                              return sel ? `${sel.name}${sel.location ? ` - ${sel.location}` : ''}` : 'Select bin';
                            })()
                          : 'Select bin'}
                      </span>
                      <span className="bin-select-arrow">▾</span>
                    </button>
                    {binSelectOpen && (
                      <div className="bin-select-list" role="listbox">
                        <div className="bin-select-search-wrap">
                          <input
                            ref={binSearchInputRef}
                            key="bin-search-add"
                            type="text"
                            className="bin-select-search"
                            placeholder="Type to search bin name or #..."
                            value={binSearchQuery}
                            onChange={(e) => {
                              setBinSearchQuery(e.target.value);
                              requestAnimationFrame(() => binSearchInputRef.current?.focus());
                            }}
                            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Search bins"
                            autoComplete="off"
                          />
                        </div>
                        <button
                          type="button"
                          className="bin-select-option"
                          onClick={() => { setFormData((p) => ({ ...p, assigned_bin_id: '' })); setTouched((t) => ({ ...t, assigned_bin_id: true })); setBinSelectOpen(false); setBinSearchQuery(''); }}
                          role="option"
                        >
                          Select bin
                        </button>
                        {filteredBinsAdd.length > 0 ? (
                          filteredBinsAdd.map((bin) => (
                            <button
                              key={bin.id}
                              type="button"
                              className={`bin-select-option ${formData.assigned_bin_id === bin.id ? 'selected' : ''}`}
                              disabled={!!bin.assigned_collector_id}
                              onClick={() => {
                                if (bin.assigned_collector_id) return;
                                setFormData((p) => ({ ...p, assigned_bin_id: bin.id }));
                                setTouched((t) => ({ ...t, assigned_bin_id: true }));
                                setBinSelectOpen(false);
                                setBinSearchQuery('');
                              }}
                              role="option"
                            >
                              {bin.name}{bin.location ? ` - ${bin.location}` : ''}{bin.assigned_collector_id ? ' (Unavailable)' : ''}
                            </button>
                          ))
                        ) : (
                          <div className="bin-select-no-results">No matches</div>
                        )}
                      </div>
                    )}
                  </div>
                    );
                  })()}
                  {errors.assigned_bin_id && <span className="error-message">{errors.assigned_bin_id}</span>}
                  <input type="hidden" name="role" value="COLLECTOR" />
                  <input type="hidden" name="assigned_bin_id" value={formData.assigned_bin_id || ''} />
                </div>
                {/* Address Section */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', marginBottom: '1rem' }}>
                  <h4 style={{ marginBottom: '1.25rem', marginTop: '0.5rem', color: '#374151', fontSize: '1rem', fontWeight: '600' }}>Address Information</h4>
                  <AddressDropdowns
                    value={formData.address}
                    onChange={(newAddress) => setFormData({ ...formData, address: newAddress })}
                    disabled={false}
                    errors={errors}
                    touched={touched}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading || !emailVerified}>
                  {loading ? 'Creating...' : emailVerified ? 'Create Account' : 'Verify email first'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingUser && !showSaveConfirmModal && (
        <div className="modal-overlay" onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (e.target === e.currentTarget) {
            // Only prevent if clicking directly on overlay, not modal content
            return;
          }
        }}>
          <div className="modal-content maximized" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Employee Account</h2>
            </div>
            <form onSubmit={handleUpdateEmployee} className="employee-form">
              <div className="form-grid">
                <div className={`form-group ${editErrors.first_name ? 'has-error' : ''}`}>
                  <label>First Name *</label>
                  <input 
                    type="text" 
                    name="first_name"
                    value={editingUser.first_name || ''}
                    onChange={handleEditInputChange}
                    onBlur={handleEditBlur}
                  />
                  {editErrors.first_name && <span className="error-message">{editErrors.first_name}</span>}
                </div>
                <div className={`form-group ${editErrors.last_name ? 'has-error' : ''}`}>
                  <label>Last Name *</label>
                  <input 
                    type="text" 
                    name="last_name"
                    value={editingUser.last_name} 
                    onChange={handleEditInputChange}
                    onBlur={handleEditBlur}
                  />
                  {editErrors.last_name && <span className="error-message">{editErrors.last_name}</span>}
                </div>
                <div className={`form-group ${editErrors.middle_name ? 'has-error' : ''}`}>
                  <label>Middle Name</label>
                  <input 
                    type="text" 
                    name="middle_name"
                    value={editingUser.middle_name || ''} 
                    onChange={handleEditInputChange}
                    onBlur={handleEditBlur}
                  />
                  {editErrors.middle_name && <span className="error-message">{editErrors.middle_name}</span>}
                </div>
                <div className={`form-group ${editErrors.contact ? 'has-error' : ''}`}>
                  <label>Contact Number</label>
                  <input 
                    type="text" 
                    name="contact"
                    value={editingUser.contact || ''} 
                    onChange={handleEditInputChange}
                    onBlur={handleEditBlur}
                    placeholder="09XXXXXXXXX"
                  />
                  {editErrors.contact && <span className="error-message">{editErrors.contact}</span>}
                </div>
                <div className="form-group">
                  <label>Assign Bin</label>
                  <select
                    name="assigned_bin_id"
                    value={editAssignedBinId || ''}
                    onChange={(e) => setEditAssignedBinId(e.target.value)}
                  >
                    <option value="">No bin assigned</option>
                    {bins.map((bin) => (
                      <option
                        key={bin.id}
                        value={bin.id}
                        disabled={!!bin.assigned_collector_id && bin.assigned_collector_id !== editingUser.id}
                      >
                        {bin.name}{bin.location ? ` - ${bin.location}` : ''}{bin.assigned_collector_id && bin.assigned_collector_id !== editingUser.id ? ' (Unavailable)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="accounts-header">
        <div>
          <h1>Account Management</h1>
          <p>Collectors and Supervisors Accounts</p>
        </div>
        <button className="add-employee-btn" onClick={() => setShowAddModal(true)}>
          <AddIcon /> Add Collector
        </button>
      </div>

      {/* --- FILTERS --- */}
      <div className="filters-row">
        <input type="text" placeholder="Search by name..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* --- TABLE (Desktop) --- */}
      <div className="accounts-table">
        <div className="table-header">
          <div>Collector Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        <div className="table-body">
          {currentUsers.map(user => (
            <div key={user.id} className="table-row">
              <div className="td-name">
                <div className="user-avatar">{user.first_name?.charAt(0).toUpperCase()}</div>
                <span>{getFullName(user)}</span>
              </div>
              <div>{user.email}</div>
              <div className="td-role">{user.role}</div>
              <div>
                <span className={`status-badge ${user.status?.toLowerCase()}`}>{user.status}</span>
              </div>
              <div className="td-actions">
                <div className="actions-left">
                  <button 
                    className={`action-btn ${user.status === 'ACTIVE' ? 'archive-btn' : 'activate-btn'}`}
                    onClick={() => handleToggleStatus(user)}
                    disabled={loading}
                  >
                    {user.status === 'ACTIVE' ? <><ArchiveIcon /> Archive</> : <><ActivateIcon /> Activate</>}
                  </button>
                  <button 
                    className="icon-btn edit-btn" 
                    onClick={() => openEditModal(user)}
                    disabled={loading}
                    title="Edit"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CARD GRID (Mobile/Tablet) --- */}
      <div className="accounts-card-grid">
        {currentUsers.map(user => (
          <div key={user.id} className="employee-card">
            <div className="card-header-top">
              <span className={`card-status-badge ${user.status?.toLowerCase()}`}>{user.status}</span>
            </div>
            <div className="card-profile-section">
              <div className="card-avatar">{user.first_name?.charAt(0).toUpperCase()}</div>
              <div className="card-name-section">
                <div className="card-name-with-icon">
                  <button 
                    className="card-edit-icon-btn"
                    onClick={() => openEditModal(user)}
                    disabled={loading}
                    title="Edit user information"
                  >
                    <EditIcon />
                  </button>
                  <span>{getFullName(user)}</span>
                </div>
                <div className="card-role">{user.role}</div>
              </div>
            </div>
            <div className="card-actions-section">
              <button 
                className={`card-action-btn ${user.status === 'ACTIVE' ? 'archive-btn' : 'activate-btn'}`}
                onClick={() => handleToggleStatus(user)}
                disabled={loading}
              >
                {user.status === 'ACTIVE' ? <><ArchiveIcon /> Archive</> : <><ActivateIcon /> Activate</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- PAGINATION --- */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination">
            <button 
              className="page-btn prev-btn" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            {generatePageNumbers().map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>
              ) : (
                <button
                  key={page}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )
            ))}
            
            <button 
              className="page-btn next-btn" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Alert/Error Modal */}
      {showAlertModal && (
        <div className="confirm-modal-overlay" onClick={() => setShowAlertModal(false)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-icon">
              <AlertIcon />
            </div>
            <h3 className="confirm-modal-title">{alertTitle}</h3>
            <p className="confirm-modal-message">
              {alertMessage}
            </p>
            <div className="confirm-modal-actions">
              <button 
                className="confirm-btn-ok" 
                onClick={() => setShowAlertModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;