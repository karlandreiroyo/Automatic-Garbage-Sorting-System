import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/accounts.css';

const AddIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>;
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const CancelIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const SaveIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const ArchiveIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
const ActivateIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const EyeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOffIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const Accounts = () => { 
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'COLLECTOR',
    first_name: '',
    last_name: '',
    middle_name: '',
    contact: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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
      alert('Error fetching users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    let error = '';
    switch(name) {
      case 'first_name':
        if (!value.trim()) error = 'First name is required';
        else if (value.trim().length < 2) error = 'First name must be at least 2 characters';
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'First name can only contain letters';
        break;
      case 'last_name':
        if (!value.trim()) error = 'Last name is required';
        else if (value.trim().length < 2) error = 'Last name must be at least 2 characters';
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Last name can only contain letters';
        break;
      case 'middle_name':
        if (value && !/^[a-zA-Z\s]*$/.test(value)) error = 'Middle name can only contain letters';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'contact':
        if (!value.trim()) error = 'Contact number is required';
        else {
          const cleanedContact = value.replace(/\D/g, '');
          if (cleanedContact.length < 10) error = 'Contact number must be at least 10 digits';
          else if (cleanedContact.length > 11) error = 'Contact number must not exceed 11 digits';
        }
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 6) error = 'Password must be at least 6 characters';
        else if (!/(?=.*[a-z])/.test(value)) error = 'Password must contain at least one lowercase letter';
        else if (!/(?=.*[A-Z])/.test(value)) error = 'Password must contain at least one uppercase letter';
        else if (!/(?=.*\d)/.test(value)) error = 'Password must contain at least one number';
        break;
      case 'confirmPassword':
        if (!value) error = 'Please confirm your password';
        else if (value !== formData.password) error = 'Passwords do not match';
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = ['first_name', 'last_name', 'email', 'contact', 'password', 'confirmPassword'];
    fields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    const middleNameError = validateField('middle_name', formData.middle_name);
    if (middleNameError) newErrors.middle_name = middleNameError;
    setErrors(newErrors);
    setTouched({
      first_name: true, last_name: true, middle_name: true, email: true,
      contact: true, password: true, confirmPassword: true
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;

      const { error: dbError } = await supabase.from('users').insert([{
        auth_id: authData.user.id,
        email: formData.email,
        role: formData.role,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || null,
        contact: formData.contact || null,
        status: 'ACTIVE',
        pass_hash: formData.confirmPassword // Maps confirmPassword to pass_hash
      }]);
      if (dbError) throw dbError;
      
      setShowAddModal(false);
      setFormData({ email: '', password: '', confirmPassword: '', role: 'COLLECTOR', first_name: '', last_name: '', middle_name: '', contact: '' });
      setErrors({});
      setTouched({});
      fetchUsers();
      alert('Employee account created successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);
      if (error) throw error;
      fetchUsers();
    } catch (error) {
      alert('Error updating status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    // You can implement an Edit Modal here. For now, we alert the selection.
    alert(`Editing user: ${user.first_name}. You can implement an edit modal similar to the Add modal.`);
  };

  const getFullName = (user) => {
    const middle = user.middle_name ? ` ${user.middle_name} ` : ' ';
    return `${user.first_name}${middle}${user.last_name}`;
  };

  const getInputClass = (fieldName) => {
    if (!touched[fieldName]) return '';
    if (errors[fieldName]) return 'error-border';
    if (fieldName === 'confirmPassword' && formData.password && formData.confirmPassword && !errors[fieldName]) return 'success-border';
    if (formData[fieldName]) return 'success-border';
    return '';
  };

  const filteredUsers = users.filter(user => {
    const fullName = getFullName(user).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="accounts-container">
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content maximized" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}><CloseIcon /></button>
            <div className="modal-header">
              <div className="modal-icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <div className="modal-title-desc">
                <h2>Add New Employee</h2>
                <p>Register a new system admin or collector</p>
              </div>
            </div>
            <form onSubmit={handleAddEmployee} className="employee-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} onBlur={handleBlur} placeholder="e.g. Juan" className={getInputClass('first_name')}/>
                  {touched.first_name && errors.first_name && <span className="error-message">{errors.first_name}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} onBlur={handleBlur} placeholder="e.g. Dela Cruz" className={getInputClass('last_name')}/>
                  {touched.last_name && errors.last_name && <span className="error-message">{errors.last_name}</span>}
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input type="text" name="middle_name" value={formData.middle_name} onChange={handleInputChange} onBlur={handleBlur} placeholder="Optional" className={getInputClass('middle_name')}/>
                  {touched.middle_name && errors.middle_name && <span className="error-message">{errors.middle_name}</span>}
                </div>
                <div className="form-group">
                  <label>Account Role *</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="COLLECTOR">Collector</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="form-group full-width-group">
                  <label>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} onBlur={handleBlur} placeholder="juan.delacruz@company.com" className={getInputClass('email')}/>
                  {touched.email && errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                <div className="form-group full-width-group">
                  <label>Contact Number *</label>
                  <input type="tel" name="contact" value={formData.contact} onChange={handleInputChange} onBlur={handleBlur} placeholder="09XX XXX XXXX" className={getInputClass('contact')}/>
                  {touched.contact && errors.contact && <span className="error-message">{errors.contact}</span>}
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <div className="password-input-wrapper">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} onBlur={handleBlur} placeholder="Minimum 6 characters" className={getInputClass('password')}/>
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                  </div>
                  {touched.password && errors.password && <span className="error-message">{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <div className="password-input-wrapper">
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} onBlur={handleBlur} placeholder="Re-enter password" className={getInputClass('confirmPassword')}/>
                    <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}><CancelIcon /> Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}><SaveIcon /> {loading ? 'Processing...' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="accounts-header">
        <div><h1>Account Management</h1><p>Manage and monitor all employee accounts</p></div>
        <button className="add-employee-btn" onClick={() => setShowAddModal(true)}><AddIcon /> Add Employee</button>
      </div>

      <div className="filters-row">
        <input type="text" placeholder="Search by employee name..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select className="filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option><option value="ADMIN">Admin</option><option value="COLLECTOR">Collector</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="accounts-table">
        <div className="table-header">
          <div>Employee Name</div><div>Email</div><div>Role</div><div>Status</div><div>Actions</div>
        </div>
        <div className="table-body">
          {loading && users.length === 0 ? (<div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>Loading accounts...</div>) 
          : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.id} className="table-row">
                <div className="td-name">
                  <div className="user-avatar">{user.first_name?.charAt(0).toUpperCase()}</div>
                  <span>{getFullName(user)}</span>
                </div>
                <div>{user.email}</div>
                <div className="td-role" style={{textTransform: 'capitalize'}}>{user.role?.toLowerCase()}</div>
                <div><span className={`status-badge ${user.status?.toLowerCase()}`}>{user.status}</span></div>
                <div className="td-actions">
                  <button className={`action-btn ${user.status === 'ACTIVE' ? 'archive-btn' : 'activate-btn'}`} onClick={() => handleToggleStatus(user.id, user.status)}>
                    {user.status === 'ACTIVE' ? <><ArchiveIcon /> Archive</> : <><ActivateIcon /> Activate</>}
                  </button>
                  <button className="icon-btn edit-btn" onClick={() => handleEdit(user)}><EditIcon /></button>
                </div>
              </div>
            ))
          ) : (<div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>No employee accounts found.</div>)}
        </div>
      </div>
    </div>
  );
};

export default Accounts;