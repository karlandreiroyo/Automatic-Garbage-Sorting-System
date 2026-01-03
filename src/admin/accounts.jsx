/**
 * Accounts Component
 * Manages user accounts (employees and supervisors) with CRUD operations
 * Features: Search, filter by role/status, activate, archive, and delete users
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/accounts.css';

const AddIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>;
const AlertIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4M12 16h.01"/></svg>;

const Accounts = () => { 
  // State for storing all users from database
  const [users, setUsers] = useState([]);
  // State for search input value
  const [searchTerm, setSearchTerm] = useState('');
  // State for role filter (all, supervisor, collector)
  const [filterRole, setFilterRole] = useState('all');
  // State for status filter (all, active, inactive)
  const [filterStatus, setFilterStatus] = useState('all');
  // State to control add employee modal visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    role: 'collector',
    first_name: '',
    last_name: '',
    middle_name: '',
    contact: '',
  });

  // Fetch users from database on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Fetches all users from the Supabase database
   * Orders them by creation date (newest first)
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch users...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*');

      console.log('Response data:', data);
      console.log('Response error:', error);
      console.log('Data length:', data?.length);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Setting users state with:', data);
      setUsers(data || []);
      console.log('Users state should now be:', data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
      alert('Error loading users. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.first_name || !formData.last_name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const fullName = `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`.trim();
      
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email: formData.email,
            role: formData.role,
            name: fullName,
            first_name: formData.first_name,
            last_name: formData.last_name,
            middle_name: formData.middle_name || null,
            contact: formData.contact,
            status: 'active'
          }
        ]);

      if (error) throw error;

      alert('Employee added successfully!');
      setShowAddModal(false);
      setFormData({
        email: '',
        role: 'collector',
        first_name: '',
        last_name: '',
        middle_name: '',
        contact: '',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('Error adding employee: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Activates a user account by setting status to 'active'
   * @param {string} userId - The ID of the user to activate
   */
  const handleActivateAccount = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error activating account:', error);
      alert('Error activating account: ' + error.message);
    }
  };

  /**
   * Archives a user account by setting status to 'inactive'
   * @param {string} userId - The ID of the user to archive
   */
  const handleArchive = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error archiving user:', error);
      alert('Error archiving user: ' + error.message);
    }
  };

  /**
   * Deletes a user account from the database
   * Shows confirmation dialog before deletion
   * @param {string} userId - The ID of the user to delete
   */
  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (error) throw error;
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
      }
    }
  };

  /**
   * Filters users based on search term, role, and status
   * Returns users that match all filter criteria
   */
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role?.toLowerCase() === filterRole.toLowerCase();
    const matchesStatus = filterStatus === 'all' || user.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="accounts-container">
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box add-employee-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrapper">
              <AlertIcon />
            </div>
            <h3>Add New Employee</h3>
            <p>Fill in the details to create a new account</p>
            
            <form onSubmit={handleAddEmployee} className="employee-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  placeholder="+63"
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="collector">Collector</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-modal btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal btn-confirm" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="accounts-header">
        <div>
          <h1>Account Management</h1>
          <p>Employees and Supervisors Management</p>
        </div>
        <button className="add-employee-btn" onClick={() => setShowAddModal(true)}>
          <AddIcon /> Add Employee
        </button>
      </div>

      {/* Filter and Search Section */}
      <div className="filters-row">
        <input
          type="text"
          placeholder="Search Bar"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="filter-select"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">Choose Role</option>
          <option value="supervisor">Supervisor</option>
          <option value="collector">Collector</option>
        </select>
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Choose Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading && <div className="loading-message">Loading users...</div>}

      <div className="accounts-table">
        {/* Table Header */}
        <div className="table-header">
          <div className="th-name">Name</div>
          <div className="th-role">Role</div>
          <div className="th-status">Status</div>
          <div className="th-actions">Actions</div>
        </div>

        {/* Table Body with User Rows */}
        <div className="table-body">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.id} className="table-row">
                <div className="td-name">
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase() || user.first_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span>{user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'}</span>
                </div>
                <div className="td-role">{user.role || 'N/A'}</div>
                <div className="td-status">
                  <span className={`status-badge ${user.status?.toLowerCase()}`}>
                    {user.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                <div className="td-actions">
                  <button 
                    className="action-btn activate-btn"
                    onClick={() => handleActivateAccount(user.id)}
                    disabled={user.status === 'active'}
                  >
                    ACTIVATE ACCOUNT
                  </button>
                  <button 
                    className="action-btn archive-btn"
                    onClick={() => handleArchive(user.id)}
                  >
                    ARCHIVE
                  </button>
                  <button className="icon-btn view-btn">
                    👁️
                  </button>
                  <button 
                    className="icon-btn edit-btn"
                    onClick={() => handleDelete(user.id)}
                  >
                    ✏️
                  </button>
                </div>
              </div>
            ))
          ) : (
            !loading && (
              <div className="no-results">
                <p>No users found</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Accounts;