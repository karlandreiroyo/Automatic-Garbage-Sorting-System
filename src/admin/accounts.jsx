import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/accounts.css';

// --- Icons ---
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
  const [editingUser, setEditingUser] = useState(null); // State for the user being edited
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

  // --- Handlers for Status Toggle ---
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'INACTIVE' ? 'archive' : 'activate';

    if (!window.confirm(`Are you sure you want to ${actionLabel} ${user.first_name}?`)) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state for immediate feedback
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Editing ---
  const openEditModal = (user) => {
    setEditingUser({ ...user }); // Clone user into editing state
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
          middle_name: editingUser.middle_name,
          contact: editingUser.contact,
          role: editingUser.role
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      alert('Account updated successfully!');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      alert('Error updating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- (Existing Validation Logic) ---
  const validateField = (name, value) => {
    let error = '';
    switch(name) {
      case 'first_name':
        if (!value.trim()) error = 'First name is required';
        else if (value.trim().length < 2) error = 'First name must be at least 2 characters';
        break;
      case 'last_name':
        if (!value.trim()) error = 'Last name is required';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 6) error = 'Min 6 characters';
        break;
      case 'confirmPassword':
        if (value !== formData.password) error = 'Passwords do not match';
        break;
      default: break;
    }
    return error;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const newErrors = {};
    ['first_name', 'last_name', 'email', 'password', 'confirmPassword'].forEach(f => {
        const err = validateField(f, formData[f]);
        if (err) newErrors[f] = err;
    });
    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

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
        status: 'ACTIVE'
      }]);

      if (dbError) throw dbError;
      
      setShowAddModal(false);
      setFormData({ email: '', password: '', confirmPassword: '', role: 'COLLECTOR', first_name: '', last_name: '', middle_name: '', contact: '' });
      fetchUsers();
      alert('Employee account created successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = (user) => {
    const middle = user.middle_name ? ` ${user.middle_name} ` : ' ';
    return `${user.first_name}${middle}${user.last_name}`;
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
      
      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content maximized" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Employee</h2>
            </div>
            <form onSubmit={handleAddEmployee} className="employee-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} onBlur={handleBlur} />
                  {errors.first_name && <span className="error-message">{errors.first_name}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} onBlur={handleBlur} />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} onBlur={handleBlur} />
                </div>
                <div className="form-group">
                  <label>Account Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="COLLECTOR">Collector</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content maximized" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Employee Account</h2>
            </div>
            <form onSubmit={handleUpdateEmployee} className="employee-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" value={editingUser.first_name} onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" value={editingUser.last_name} onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input type="text" value={editingUser.contact || ''} onChange={(e) => setEditingUser({...editingUser, contact: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}>
                    <option value="COLLECTOR">Collector</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="accounts-header">
        <div>
          <h1>Account Management</h1>
          <p>Manage and monitor all employee accounts</p>
        </div>
        <button className="add-employee-btn" onClick={() => setShowAddModal(true)}>
          <AddIcon /> Add Employee
        </button>
      </div>

      {/* --- FILTERS --- */}
      <div className="filters-row">
        <input type="text" placeholder="Search by name..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <select className="filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="COLLECTOR">Collector</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* --- TABLE --- */}
      <div className="accounts-table">
        <div className="table-header">
          <div>Employee Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        <div className="table-body">
          {filteredUsers.map(user => (
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
                <button 
                  className={`action-btn ${user.status === 'ACTIVE' ? 'archive-btn' : 'activate-btn'}`}
                  onClick={() => handleToggleStatus(user)}
                >
                  {user.status === 'ACTIVE' ? <><ArchiveIcon /> Archive</> : <><ActivateIcon /> Activate</>}
                </button>
                <button className="icon-btn edit-btn" onClick={() => openEditModal(user)}>
                  <EditIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Accounts;