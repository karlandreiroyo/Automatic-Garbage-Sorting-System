import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/accounts.css';

const Accounts = () => { 
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role?.toLowerCase() === filterRole.toLowerCase();
    const matchesStatus = filterStatus === 'all' || user.status?.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <div>
          <h1>Account Management</h1>
          <p>Employees and Supervisors Management</p>
        </div>
        <button className="add-employee-btn" onClick={() => setShowAddModal(true)}>
          + Add Employee
        </button>
      </div>

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

      <div className="accounts-table">
        <div className="table-header">
          <div className="th-name">Name</div>
          <div className="th-role">Role</div>
          <div className="th-status">Status</div>
          <div className="th-actions">Actions</div>
        </div>

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

      {filteredUsers.length === 0 && (
        <div className="no-results">
          <p>No users found</p>
        </div>
      )}
    </div>
  );
};

export default Accounts;