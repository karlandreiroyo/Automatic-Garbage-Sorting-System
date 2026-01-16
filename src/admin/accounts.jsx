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
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editTouched, setEditTouched] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isNotificationHiding, setIsNotificationHiding] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
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
      
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
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
      case 'contact':
        if (value && !/^[0-9+\-\s()]*$/.test(value)) error = 'Invalid contact number format';
        else if (value && value.replace(/[^0-9]/g, '').length < 10) error = 'Contact must be at least 10 digits';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 6) error = 'Password must be at least 6 characters';
        break;
      case 'confirmPassword':
        if (value !== formData.password) error = 'Passwords do not match';
        break;
      default: break;
    }
    return error;
  };

  const validateEditField = (name, value) => {
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
      case 'contact':
        if (value && !/^[0-9+\-\s()]*$/.test(value)) error = 'Invalid contact number format';
        else if (value && value.replace(/[^0-9]/g, '').length < 10) error = 'Contact must be at least 10 digits';
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

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({ ...prev, [name]: value }));
    if (editTouched[name]) {
      setEditErrors(prev => ({ ...prev, [name]: validateEditField(name, value) }));
    }
  };

  const handleEditBlur = (e) => {
    const { name, value } = e.target;
    setEditTouched(prev => ({ ...prev, [name]: true }));
    setEditErrors(prev => ({ ...prev, [name]: validateEditField(name, value) }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    ['first_name', 'last_name', 'email', 'password', 'confirmPassword', 'middle_name', 'contact'].forEach(f => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ 
        first_name: true, 
        last_name: true, 
        email: true, 
        password: true, 
        confirmPassword: true,
        middle_name: true,
        contact: true 
      });
      return;
    }

    try {
      setLoading(true);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) throw authError;

      const { error: dbError } = await supabase.from('users').insert([{
        auth_id: authData.user.id,
        email: formData.email.trim(),
        role: formData.role,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        middle_name: formData.middle_name?.trim() || null,
        contact: formData.contact?.trim() || null,
        status: 'ACTIVE'
      }]);

      if (dbError) throw dbError;
      
      setShowAddModal(false);
      setFormData({ 
        email: '', 
        password: '', 
        confirmPassword: '', 
        role: 'COLLECTOR', 
        first_name: '', 
        last_name: '', 
        middle_name: '', 
        contact: '' 
      });
      setErrors({});
      setTouched({});
      fetchUsers();
      showSuccessNotification('Employee account created successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    ['first_name', 'last_name', 'middle_name', 'contact'].forEach(f => {
      const err = validateEditField(f, editingUser[f]);
      if (err) newErrors[f] = err;
    });
    
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      setEditTouched({ first_name: true, last_name: true, middle_name: true, contact: true });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update({
          first_name: editingUser.first_name.trim(),
          last_name: editingUser.last_name.trim(),
          middle_name: editingUser.middle_name?.trim() || null,
          contact: editingUser.contact?.trim() || null,
          role: editingUser.role
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setEditingUser(null);
      setEditErrors({});
      setEditTouched({});
      fetchUsers();
      showSuccessNotification(`${editingUser.first_name}'s personal information has been updated successfully!`);
    } catch (error) {
      alert('Error updating user: ' + error.message);
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
  }, [searchTerm, filterRole, filterStatus]);

  return (
    <div className="accounts-container">
      
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
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content maximized">
            <div className="modal-header">
              <h2>Add New Employee</h2>
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
                <div className={`form-group ${errors.contact ? 'has-error' : ''}`}>
                  <label>Contact Number</label>
                  <input 
                    type="text" 
                    name="contact" 
                    value={formData.contact} 
                    onChange={handleInputChange} 
                    onBlur={handleBlur} 
                    placeholder="e.g., +63 912 345 6789"
                  />
                  {errors.contact && <span className="error-message">{errors.contact}</span>}
                </div>
                <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                  <label>Email Address *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    onBlur={handleBlur} 
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Account Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="COLLECTOR">Collector</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
                  <label>Password *</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    onBlur={handleBlur}
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>
                <div className={`form-group ${errors.confirmPassword ? 'has-error' : ''}`}>
                  <label>Confirm Password *</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleInputChange} 
                    onBlur={handleBlur}
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content maximized">
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
                    value={editingUser.first_name} 
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
                    placeholder="e.g., +63 912 345 6789"
                  />
                  {editErrors.contact && <span className="error-message">{editErrors.contact}</span>}
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select 
                    name="role"
                    value={editingUser.role} 
                    onChange={handleEditInputChange}
                  >
                    <option value="COLLECTOR">Collector</option>
                    <option value="ADMIN">Admin</option>
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

      {/* --- PAGINATION --- */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} entries
          </div>
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
    </div>
  );
};

export default Accounts;