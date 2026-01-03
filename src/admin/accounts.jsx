/**
 * Accounts Component
 * Manages user accounts (employees and supervisors) with CRUD operations
 * Features: Search, filter by role/status, activate, archive, and delete users
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/accounts.css';

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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      {/* Header Section with Title and Add Button */}
      <div className="accounts-header">
        <div>
          <h1>Account Management</h1>
          <p>Employees and Supervisors Management</p>
        </div>
        <button className="add-employee-btn" onClick={() => setShowAddModal(true)}>
          + Add Employee
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

      {/* Users Table */}
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
          {filteredUsers.map(user => (
            <div key={user.id} className="table-row">
              <div className="td-name">
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <span>{user.name || 'Unknown'}</span>
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
          ))}
        </div>
      </div>

      {/* No Results Message */}
      {filteredUsers.length === 0 && (
        <div className="no-results">
          <p>No users found</p>
        </div>
      )}
    </div>
  );
};

export default Accounts;