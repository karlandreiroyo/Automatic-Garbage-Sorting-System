import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/accounts.css';

// SVG Icons
const AddIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>;
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>;
<<<<<<< HEAD
=======
const CancelIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const SaveIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const ArchiveIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
const ActivateIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7

const Accounts = () => { 
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Step 2: Add user to users table
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
      setFormData({ 
        email: '', 
        password: '',
        role: 'COLLECTOR', 
        first_name: '', 
        last_name: '', 
        middle_name: '', 
        contact: '' 
      });
      fetchUsers();
      alert('Employee account created successfully!');
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get full name
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
      
      {/* --- ADD EMPLOYEE MODAL (CENTERED) --- */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content maximized" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <CloseIcon />
            </button>
            
            <div className="modal-header">
              <div className="modal-icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <div className="modal-title-desc">
                <h2>Add New Employee</h2>
                <p>Register a new system supervisor or collector</p>
              </div>
            </div>
            
            <form onSubmit={handleAddEmployee} className="employee-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    name="first_name" 
                    value={formData.first_name} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Juan" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    name="last_name" 
                    value={formData.last_name} 
                    onChange={handleInputChange} 
                    placeholder="e.g. Dela Cruz" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input 
                    type="text" 
                    name="middle_name" 
                    value={formData.middle_name} 
                    onChange={handleInputChange} 
                    placeholder="Optional" 
                  />
                </div>
                <div className="form-group">
                  <label>Account Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange}>
                    <option value="COLLECTOR">Collector</option>
                    <option value="SUPERVISOR">Supervisor</option>
                  </select>
                </div>
                <div className="form-group full-width-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="juan.delacruz@company.com" 
                    required 
                  />
                </div>
                <div className="form-group full-width-group">
                  <label>Temporary Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="Minimum 6 characters" 
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group full-width-group">
                  <label>Contact Number</label>
                  <input 
                    type="tel" 
                    name="contact" 
                    value={formData.contact} 
                    onChange={handleInputChange} 
                    placeholder="+63 9XX XXX XXXX" 
                  />
                </div>
              </div>

              <div className="modal-footer">
<<<<<<< HEAD
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Create Account'}
=======
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  <CancelIcon /> Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  <SaveIcon /> {loading ? 'Processing...' : 'Create Account'}
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PAGE HEADER --- */}
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
        <input 
          type="text" 
          placeholder="Search by employee name..." 
          className="search-input" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <select className="filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="COLLECTOR">Collector</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="accounts-table">
        <div className="table-header">
          <div>Employee Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        <div className="table-body">
          {loading ? (
            <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
              Loading accounts...
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.id} className="table-row">
                <div className="td-name">
                  <div className="user-avatar">{user.first_name?.charAt(0).toUpperCase()}</div>
                  <span>{getFullName(user)}</span>
                </div>
                <div>{user.email}</div>
                <div className="td-role" style={{textTransform: 'capitalize'}}>
                  {user.role?.toLowerCase()}
                </div>
                <div>
                  <span className={`status-badge ${user.status?.toLowerCase()}`}>
                    {user.status}
                  </span>
                </div>
                <div className="td-actions">
                  {user.status === 'ACTIVE' ? (
                    <button className="action-btn archive-btn">
<<<<<<< HEAD
                      Archive
                    </button>
                  ) : (
                    <button className="action-btn activate-btn">
                      Activate
                    </button>
                  )}
                  <button className="icon-btn edit-btn">✏️</button>
=======
                      <ArchiveIcon /> Archive
                    </button>
                  ) : (
                    <button className="action-btn activate-btn">
                      <ActivateIcon /> Activate
                    </button>
                  )}
                  <button className="icon-btn edit-btn">
                    <EditIcon />
                  </button>
>>>>>>> 57c2a03f9c1bc20f118311fcacbba6fe257a33a7
                </div>
              </div>
            ))
          ) : (
            <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
              No employee accounts found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Accounts;