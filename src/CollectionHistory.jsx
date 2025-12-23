import React, { useState } from 'react';

// --- 1. ICONS ---
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

  // --- 2. DATA (Expanded to include Page 2 items) ---
  const historyData = [
    // PAGE 1 ITEMS
    { id: 1, type: 'Non-Biodegradable', date: 'Jan 17, 2025', time: '09:30 AM', collector: 'Kelly', weight: '45.2 kg', status: 'Completed' },
    { id: 2, type: 'Recyclable', date: 'Jan 17, 2025', time: '10:15 AM', collector: 'Kim', weight: '32.8 kg', status: 'Completed' },
    { id: 3, type: 'Biodegradable', date: 'Jan 14, 2025', time: '02:45 PM', collector: 'Carlo', weight: '28.5 kg', status: 'Completed' },
    { id: 4, type: 'Non-Biodegradable', date: 'Jan 14, 2025', time: '11:20 AM', collector: 'Charize', weight: '52.1 kg', status: 'Completed' },
    
    // PAGE 2 ITEMS (From your new image)
    { id: 5, type: 'Non-Biodegradable', date: 'Jan 13, 2025', time: '09:30 AM', collector: 'Kim', weight: '45.2 kg', status: 'Completed' },
    { id: 6, type: 'Recyclable', date: 'Jan 14, 2025', time: '10:15 AM', collector: 'Carlo', weight: '32.8 kg', status: 'Completed' },
  ];

  // Logic to Filter
  const filteredList = filter === 'All' 
    ? historyData 
    : historyData.filter(item => item.type.replace('-', ' ').includes(filter));

  // Logic to Paginate
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  // Helper for Icons
  const getTypeIcon = (type) => {
    if (type.includes('Non')) return <div className="list-icon icon-red"><TrashIcon /></div>;
    if (type.includes('Recyclable')) return <div className="list-icon icon-blue"><RecycleIcon /></div>;
    return <div className="list-icon icon-green"><LeafIcon /></div>;
  };

  return (
    <>
      <style>{`
        .history-page { max-width: 1000px; margin: 0 auto; padding: 20px 40px; font-family: 'Segoe UI', sans-serif; color: #333; }
        .history-header-text h1 { font-size: 1.8rem; color: #1a1a1a; margin: 0 0 8px 0; font-weight: 700; }
        .history-header-text p { color: #666; font-size: 0.95rem; margin-bottom: 32px; }
        
        /* Stats Box */
        .stats-row { display: flex; gap: 60px; margin-bottom: 40px; flex-wrap: wrap; }
        .stats-box { display: flex; align-items: flex-start; gap: 16px; }
        .stats-icon-bg { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stats-icon-bg svg { width: 24px; height: 24px; }
        .bg-green-light { background-color: #e8f5e9; color: #008751; }
        .bg-blue-light { background-color: #e3f2fd; color: #1976d2; }
        .bg-purple-light { background-color: #f3e5f5; color: #9c27b0; }
        .stats-content { display: flex; flex-direction: column; justify-content: center; }
        .stats-label { font-size: 0.85rem; color: #666; margin-bottom: 4px; }
        .stats-value { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; line-height: 1.2; }
        .stats-value small { font-size: 1rem; font-weight: 500; margin-left: 4px; }

        /* Filter Tabs */
        .filter-tabs { display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap; }
        .filter-btn { padding: 10px 20px; border-radius: 6px; border: 1px solid #e0e0e0; background: white; color: #555; cursor: pointer; font-weight: 500; font-size: 0.95rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: 0.2s; }
        .filter-btn:hover { background: #f9f9f9; }
        .filter-btn.active { background-color: #008751; color: white; border-color: #008751; }

        /* List Cards */
        .history-list { display: flex; flex-direction: column; gap: 16px; min-height: 400px; } /* Min height stops layout jump */
        .history-list-card { display: flex; background: white; padding: 30px; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.03); align-items: flex-start; }
        
        .card-left { margin-right: 25px; padding-top: 5px; }
        .list-icon { width: 24px; height: 24px; }
        .icon-red { color: #d32f2f; }
        .icon-blue { color: #1976d2; }
        .icon-green { color: #2e7d32; }
        
        .card-middle { flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .card-middle h3 { margin: 0 0 4px 0; font-size: 1.05rem; color: #111; font-weight: 700; }
        .light-text { font-weight: 400; color: #111; }
        .card-meta-row { display: flex; gap: 50px; }
        .meta-item { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #555; width: 180px; }
        
        .card-right { display: flex; align-items: flex-start; height: 100%; padding-top: 5px; }
        .status-completed { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; font-weight: 600; color: #008751; }

        /* Pagination */
        .pagination { display: flex; justify-content: center; gap: 10px; margin-top: 50px; margin-bottom: 30px; }
        .page-btn { width: 40px; height: 40px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; color: #333; font-weight: 600; display: flex; align-items: center; justify-content: center; }
        .page-btn.active { background-color: #1b5e20; color: white; border-color: #1b5e20; }
        .page-btn.next-btn { width: auto; padding: 0 20px; }
      `}</style>

      <div className="history-page">
        <div className="history-header-text">
          <h1>Collection History</h1>
          <p>Track all waste collection activities and logs</p>
        </div>

        {/* Top Stats */}
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
          {['All', 'Biodegradable', 'Non Biodegradable', 'Recyclable'].map((tab) => (
            <button key={tab} className={`filter-btn ${filter === tab ? 'active' : ''}`} onClick={() => { setFilter(tab); setCurrentPage(1); }}>
              {tab}
            </button>
          ))}
        </div>

        {/* List Cards (Paginated) */}
        <div className="history-list">
          {currentItems.map((item) => (
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

        {/* Pagination Controls */}
        <div className="pagination">
          <button 
            className={`page-btn ${currentPage === 1 ? 'active' : ''}`} 
            onClick={() => setCurrentPage(1)}
          >
            1
          </button>
          <button 
            className={`page-btn ${currentPage === 2 ? 'active' : ''}`} 
            onClick={() => setCurrentPage(2)}
          >
            2
          </button>
          <button 
            className="page-btn next-btn" 
            onClick={() => setCurrentPage(curr => Math.min(curr + 1, 2))}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default CollectionHistory;