import React, { useState } from 'react';
import '../employee/employeecss/CollectionHistory.css'; // Link sa hiwalay na CSS file

// --- ICONS ---
const LeafIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;
const TrashIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const RecycleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>;
const CalendarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const ClockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const UserIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const SmallTrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const CheckCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

const CollectionHistory = () => {
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const historyData = [
    { id: 1, type: 'Non-Biodegradable', date: 'Jan 17, 2025', time: '09:30 AM', collector: 'Kelly', weight: '45.2 kg', status: 'Completed' },
    { id: 2, type: 'Recyclable', date: 'Jan 17, 2025', time: '10:15 AM', collector: 'Kim', weight: '32.8 kg', status: 'Completed' },
    { id: 3, type: 'Biodegradable', date: 'Jan 14, 2025', time: '02:45 PM', collector: 'Carlo', weight: '28.5 kg', status: 'Completed' },
    { id: 4, type: 'Non-Biodegradable', date: 'Jan 14, 2025', time: '11:20 AM', collector: 'Charize', weight: '52.1 kg', status: 'Completed' },
    { id: 5, type: 'Non-Biodegradable', date: 'Jan 13, 2025', time: '09:30 AM', collector: 'Kim', weight: '45.2 kg', status: 'Completed' },
    { id: 6, type: 'Recyclable', date: 'Jan 14, 2025', time: '10:15 AM', collector: 'Carlo', weight: '32.8 kg', status: 'Completed' },
  ];

  const filteredList = filter === 'All' 
    ? historyData 
    : historyData.filter(item => item.type === filter);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  const getTypeIcon = (type) => {
    if (type.includes('Non')) return <div className="list-icon icon-red"><TrashIcon /></div>;
    if (type.includes('Recyclable')) return <div className="list-icon icon-blue"><RecycleIcon /></div>;
    return <div className="list-icon icon-green"><LeafIcon /></div>;
  };

  return (
    <div className="history-page">
      <div className="history-header-text">
        <h1>Collection History</h1>
        <p>Track all waste collection activities and logs</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stats-box">
          <div className="stats-icon-bg bg-green-light"><CheckCircleIcon /></div>
          <div className="stats-content"><span className="stats-label">Total<br/>Collections</span><span className="stats-value">8</span></div>
        </div>
        <div className="stats-box">
          <div className="stats-icon-bg bg-blue-light"><TrashIcon /></div>
          <div className="stats-content"><span className="stats-label">Total<br/>Weight</span><span className="stats-value">306.7 <small>kg</small></span></div>
        </div>
        <div className="stats-box">
          <div className="stats-icon-bg bg-purple-light"><CalendarIcon /></div>
          <div className="stats-content"><span className="stats-label">This<br/>Week</span><span className="stats-value">4</span></div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['All', 'Biodegradable', 'Non-Biodegradable', 'Recyclable'].map(tab => (
          <button key={tab} className={`filter-btn ${filter === tab ? 'active' : ''}`} onClick={() => { setFilter(tab); setCurrentPage(1); }}>{tab}</button>
        ))}
      </div>

      {/* List Cards */}
      <div className="history-list">
        {currentItems.map(item => (
          <div key={item.id} className="history-list-card">
            <div className="card-left">{getTypeIcon(item.type)}</div>
            <div className="card-middle">
              <h3>{item.type} <span className="light-text">Collection</span></h3>
              <div className="card-meta-row">
                <div className="meta-item"><CalendarIcon /> <span>{item.date}</span></div>
                <div className="meta-item"><ClockIcon /> <span>{item.time}</span></div>
              </div>
              <div className="card-meta-row">
                <div className="meta-item"><UserIcon /> <span>Collected by: {item.collector}</span></div>
                <div className="meta-item"><SmallTrashIcon /> <span>Weight: {item.weight}</span></div>
              </div>
            </div>
            <div className="card-right">
              <span className="status-completed"><CheckCircleIcon /> {item.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className={`page-btn ${currentPage === 1 ? 'active' : ''}`} onClick={() => setCurrentPage(1)}>1</button>
        <button className={`page-btn ${currentPage === 2 ? 'active' : ''}`} onClick={() => setCurrentPage(2)}>2</button>
        <button className="page-btn next-btn" onClick={() => setCurrentPage(curr => Math.min(curr + 1, 2))}>Next</button>
      </div>
    </div>
  );
};

export default CollectionHistory;