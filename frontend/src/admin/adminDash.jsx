import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/adminDash.css';

// SVG Icons matching the photo
const Icons = {
  TotalBins: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M21 8l-2-2H5L3 8h18zM3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M10 12h4" />
    </svg>
  ),
  ItemsSorted: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
    </svg>
  ),
  ProcessingTime: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  Collector: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Supervisor: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M12 11v4M10 13h4" />
    </svg>
  ),
  TotalEmployees: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
};

const AdminDash = ({ onNavigateTo }) => {
  const [stats, setStats] = useState({
    totalBins: 0,
    overallItemsSorted: 0,
    avgProcessingTime: 0,
    collectors: 0,
    supervisor: 0,
    totalEmployees: 0
  });
  
  const [distribution, setDistribution] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [collectorsList, setCollectorsList] = useState([]);
  const [collectorsDropdownOpen, setCollectorsDropdownOpen] = useState(false);
  const collectorsDropdownRef = React.useRef(null);
  const [superadminsList, setSuperadminsList] = useState([]);
  const [superadminsDropdownOpen, setSuperadminsDropdownOpen] = useState(false);
  const superadminsDropdownRef = React.useRef(null);
  const [employeesList, setEmployeesList] = useState([]);
  const [employeesDropdownOpen, setEmployeesDropdownOpen] = useState(false);
  const employeesDropdownRef = React.useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time: refetch dashboard when users table changes (new collector/admin, status change, etc.)
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchDashboardData();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchWasteDistribution(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (collectorsDropdownRef.current && !collectorsDropdownRef.current.contains(e.target)) {
        setCollectorsDropdownOpen(false);
      }
      if (superadminsDropdownRef.current && !superadminsDropdownRef.current.contains(e.target)) {
        setSuperadminsDropdownOpen(false);
      }
      if (employeesDropdownRef.current && !employeesDropdownRef.current.contains(e.target)) {
        setEmployeesDropdownOpen(false);
      }
    };
    if (collectorsDropdownOpen || superadminsDropdownOpen || employeesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [collectorsDropdownOpen, superadminsDropdownOpen, employeesDropdownOpen]);

const fetchDashboardData = async () => {
  try {
    // Fetch total bins
    const { data: binsData, error: binsError } = await supabase
      .from('bins')
      .select('*')
      .eq('status', 'ACTIVE');
    
    if (binsError) throw binsError;
    
    // Fetch users to get employee counts and lists (count all by role to match Supabase, including PENDING)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, role, status, first_name, last_name');

    if (usersError) throw usersError;

    const collectorUsers = usersData?.filter(u => u.role === 'COLLECTOR') || [];
    const collectors = collectorUsers.length;
    setCollectorsList(collectorUsers);
    const supervisorUsers = usersData?.filter(u => u.role === 'SUPERVISOR' || u.role === 'SUPERADMIN') || [];
    const supervisors = supervisorUsers.length;
    setSuperadminsList(supervisorUsers);
    const allEmployees = usersData || [];
    const totalEmployees = allEmployees.length;
    setEmployeesList(allEmployees);

    // Fetch waste items for statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('waste_items')
      .select('*, bins(name)')
      .gte('created_at', today.toISOString());

    if (itemsError) throw itemsError;

    const overallItemsSorted = itemsData?.length || 0;
    
    // Calculate average processing time
    const avgTime = itemsData?.length > 0
      ? (itemsData.reduce((sum, item) => sum + (item.processing_time || 0), 0) / itemsData.length).toFixed(1)
      : 0;

    // Get current admin (logged-in user) for recent activity filter
    let currentAdminUser = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: userRow } = await supabase
          .from('users')
          .select('id, first_name')
          .eq('auth_id', session.user.id)
          .maybeSingle();
        currentAdminUser = userRow;
      }
    } catch {}

    // Fetch recent activity: user_id = admin who performed; get admin name from users (user_id), collector name from users (added_user_id)
    let formattedActivity = [];
    if (currentAdminUser?.id) {
      try {
        const { data: activityData, error: activityError } = await supabase
          .from('activity_logs')
          .select(`
            id, activity_type, description, created_at, user_id, added_user_id,
            actor:users!activity_logs_user_id_fkey(first_name, last_name, middle_name),
            added_user:users!activity_logs_added_user_id_fkey(first_name, last_name, middle_name)
          `)
          .eq('user_id', currentAdminUser.id)
          .eq('activity_type', 'USER_ADDED')
          .order('created_at', { ascending: false })
          .limit(4);

        if (!activityError && activityData?.length) {
          formattedActivity = activityData.map(activity => {
            const adminName = activity.actor
              ? [activity.actor.first_name, activity.actor.middle_name, activity.actor.last_name].filter(Boolean).join(' ').trim() || 'Admin'
              : 'Admin';
            const collectorName = activity.added_user
              ? [activity.added_user.first_name, activity.added_user.middle_name, activity.added_user.last_name].filter(Boolean).join(' ').trim()
              : (activity.description || 'a collector');
            return {
              text: `Admin ${adminName} Added ${collectorName}`,
              time: getTimeAgo(activity.created_at)
            };
          });
        }
      } catch {
        // Fallback if added_user_id column or FKs don't exist yet
        const { data: fallbackData } = await supabase
          .from('activity_logs')
          .select('id, description, created_at, user_id')
          .eq('user_id', currentAdminUser.id)
          .eq('activity_type', 'USER_ADDED')
          .order('created_at', { ascending: false })
          .limit(4);
        if (fallbackData?.length) {
          const adminName = currentAdminUser.first_name || 'Admin';
          formattedActivity = fallbackData.map(activity => ({
            text: `Admin ${adminName} Added ${activity.description || 'a collector'}`,
            time: getTimeAgo(activity.created_at)
          }));
        }
      }
    }

    setStats({
      totalBins: binsData?.length || 0,
      overallItemsSorted,
      avgProcessingTime: avgTime,
      collectors,
      supervisor: supervisors,
      totalEmployees
    });

    setRecentActivity(formattedActivity);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Keep your existing fallback values
  }
};

  const fetchWasteDistribution = async (dateString) => {
    try {
      const selectedDateObj = new Date(dateString);
      selectedDateObj.setHours(0, 0, 0, 0);
      const startOfDay = selectedDateObj.toISOString();
      const endOfDay = new Date(selectedDateObj);
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayISO = endOfDay.toISOString();
      const { data: itemsData, error: itemsError } = await supabase
        .from('waste_items')
        .select('*, bins(name)')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDayISO);
      if (itemsError) throw itemsError;
      const categoryCounts = {
        'Biodegradable': 0,
        'Non-Bio': 0,
        'Recycle': 0,
        'Unsorted': 0
      };
      itemsData?.forEach(item => {
        if (Object.prototype.hasOwnProperty.call(categoryCounts, item.category)) {
          categoryCounts[item.category]++;
        }
      });
      const distributionArray = Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count
      }));
      setDistribution(distributionArray);
    } catch (error) {
      console.error('Error fetching waste distribution:', error);
      setDistribution([]);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hr ago`;
  };

  const _maxCount = Math.max(...distribution.map(d => d.count), 1);

  const calculateYAxisLabels = () => {
  const maxValue = Math.max(...distribution.map(d => d.count), 0);
  
  // Round up to nearest nice number
  let roundedMax;
  if (maxValue === 0) {
    roundedMax = 100; // Default minimum scale
  } else if (maxValue <= 10) {
    roundedMax = 10;
  } else if (maxValue <= 50) {
    roundedMax = 50;
  } else if (maxValue <= 100) {
    roundedMax = 100;
  } else if (maxValue <= 200) {
    roundedMax = 200;
  } else if (maxValue <= 500) {
    roundedMax = 500;
  } else {
    roundedMax = Math.ceil(maxValue / 100) * 100;
  }
  
  // Create 9 labels (matching your current design)
  const step = roundedMax / 8;
  return [
    roundedMax,
    Math.round(roundedMax - step),
    Math.round(roundedMax - (step * 2)),
    Math.round(roundedMax - (step * 3)),
    Math.round(roundedMax - (step * 4)),
    Math.round(roundedMax - (step * 5)),
    Math.round(roundedMax - (step * 6)),
    Math.round(roundedMax - (step * 7)),
    0
  ];
};

  return (
    <div className="admin-dash-container">
      <div className="dashboard-title-section">
        <h1 className="main-title">Dashboard Overview</h1>
        <p className="sub-title">Waste sorting statistics</p>
      </div>

      <div className="stats-grid">
        <div
          className="stat-card stat-card-link"
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTo?.('bins')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateTo?.('bins'); } }}
          aria-label="Go to Bin Monitoring"
        >
          <div className="stat-icon-bg"><Icons.TotalBins /></div>
          <div className="stat-info">
            <span className="stat-label">Total Bins</span>
            <h2 className="stat-value">{stats.totalBins}</h2>
          </div>
        </div>

        <div
          className="stat-card stat-card-link"
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTo?.('data')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateTo?.('data'); } }}
          aria-label="Go to Data Analytics"
        >
          <div className="stat-icon-bg"><Icons.ItemsSorted /></div>
          <div className="stat-info">
            <span className="stat-label">Overall Items Sorted</span>
            <h2 className="stat-value">{stats.overallItemsSorted}</h2>
          </div>
        </div>

        <div
          className="stat-card stat-card-link"
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTo?.('data')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigateTo?.('data'); } }}
          aria-label="Go to Data Analytics"
        >
          <div className="stat-icon-bg"><Icons.ProcessingTime /></div>
          <div className="stat-info">
            <span className="stat-label">Average Processing Time</span>
            <h2 className="stat-value">{stats.avgProcessingTime}s</h2>
          </div>
        </div>

        <div className="stat-card-wrapper stat-card-collectors-dropdown" ref={collectorsDropdownRef}>
          <div
            className="stat-card stat-card-dropdown-trigger"
            role="button"
            tabIndex={0}
            onClick={() => setCollectorsDropdownOpen((prev) => !prev)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCollectorsDropdownOpen((prev) => !prev); } }}
            aria-expanded={collectorsDropdownOpen}
            aria-label="Collectors count, click to view list"
          >
            <div className="stat-icon-bg"><Icons.Collector /></div>
            <div className="stat-info">
              <span className="stat-label">Collectors</span>
              <h2 className="stat-value">{stats.collectors}</h2>
            </div>
            <span className={`stat-card-dropdown-caret ${collectorsDropdownOpen ? 'open' : ''}`}>▾</span>
          </div>
          {collectorsDropdownOpen && (
            <div className="stat-card-dropdown">
              <div className="stat-card-dropdown-title">All Collectors</div>
              <ul className="stat-card-dropdown-list">
                {collectorsList.length === 0 ? (
                  <li className="stat-card-dropdown-item empty">No collectors</li>
                ) : (
                  collectorsList.map((c) => (
                    <li key={c.id || `${c.first_name}-${c.last_name}`} className="stat-card-dropdown-item">
                      {[c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="stat-card-wrapper stat-card-superadmins-dropdown" ref={superadminsDropdownRef}>
          <div
            className="stat-card stat-card-dropdown-trigger"
            role="button"
            tabIndex={0}
            onClick={() => setSuperadminsDropdownOpen((prev) => !prev)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSuperadminsDropdownOpen((prev) => !prev); } }}
            aria-expanded={superadminsDropdownOpen}
            aria-label="Superadmin count, click to view list"
          >
            <div className="stat-icon-bg"><Icons.Supervisor /></div>
            <div className="stat-info">
              <span className="stat-label">Superadmin</span>
              <h2 className="stat-value">{stats.supervisor}</h2>
            </div>
            <span className={`stat-card-dropdown-caret ${superadminsDropdownOpen ? 'open' : ''}`}>▾</span>
          </div>
          {superadminsDropdownOpen && (
            <div className="stat-card-dropdown">
              <div className="stat-card-dropdown-title">All Superadmins</div>
              <ul className="stat-card-dropdown-list">
                {superadminsList.length === 0 ? (
                  <li className="stat-card-dropdown-item empty">No superadmins</li>
                ) : (
                  superadminsList.map((s) => (
                    <li key={s.id || `${s.first_name}-${s.last_name}`} className="stat-card-dropdown-item">
                      {[s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unnamed'}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="stat-card-wrapper stat-card-employees-dropdown" ref={employeesDropdownRef}>
          <div
            className="stat-card stat-card-dropdown-trigger"
            role="button"
            tabIndex={0}
            onClick={() => setEmployeesDropdownOpen((prev) => !prev)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEmployeesDropdownOpen((prev) => !prev); } }}
            aria-expanded={employeesDropdownOpen}
            aria-label="Total employees count, click to view list"
          >
            <div className="stat-icon-bg"><Icons.TotalEmployees /></div>
            <div className="stat-info">
              <span className="stat-label">Total Employees</span>
              <h2 className="stat-value">{stats.totalEmployees}</h2>
            </div>
            <span className={`stat-card-dropdown-caret ${employeesDropdownOpen ? 'open' : ''}`}>▾</span>
          </div>
          {employeesDropdownOpen && (
            <div className="stat-card-dropdown">
              {(() => {
                const collectors = employeesList.filter(e => e.role === 'COLLECTOR');
                const admins = employeesList.filter(e => e.role === 'ADMIN');
                const superAdmins = employeesList.filter(e => e.role === 'SUPERVISOR');
                return (
                  <>
                    <div className="stat-card-dropdown-title">All Collectors</div>
                    <ul className="stat-card-dropdown-list">
                      {collectors.length === 0 ? (
                        <li className="stat-card-dropdown-item empty">No collectors</li>
                      ) : (
                        collectors.map((emp) => (
                          <li key={emp.id || `${emp.first_name}-${emp.last_name}-collector`} className="stat-card-dropdown-item">
                            {[emp.first_name, emp.last_name].filter(Boolean).join(' ').toUpperCase() || 'Unnamed'}
                          </li>
                        ))
                      )}
                    </ul>
                    <div className="stat-card-dropdown-title">All Admins</div>
                    <ul className="stat-card-dropdown-list">
                      {admins.length === 0 ? (
                        <li className="stat-card-dropdown-item empty">No admins</li>
                      ) : (
                        admins.map((emp) => (
                          <li key={emp.id || `${emp.first_name}-${emp.last_name}-admin`} className="stat-card-dropdown-item">
                            {[emp.first_name, emp.last_name].filter(Boolean).join(' ').toUpperCase() || 'Unnamed'}
                          </li>
                        ))
                      )}
                    </ul>
                    <div className="stat-card-dropdown-title">All Super Admins</div>
                    <ul className="stat-card-dropdown-list">
                      {superAdmins.length === 0 ? (
                        <li className="stat-card-dropdown-item empty">No super admins</li>
                      ) : (
                        superAdmins.map((emp) => (
                          <li key={emp.id || `${emp.first_name}-${emp.last_name}-superadmin`} className="stat-card-dropdown-item">
                            {[emp.first_name, emp.last_name].filter(Boolean).join(' ').toUpperCase() || 'Unnamed'}
                          </li>
                        ))
                      )}
                    </ul>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <div className="main-charts-layout">
        <div className="chart-card-full distribution-section">
  <div className="distribution-header">
    <h3 className="section-title">Waste Distribution</h3>
    <div className="date-selector-container">
      <button
        type="button"
        className="date-nav-btn"
        onClick={() => {
          const prevDate = new Date(selectedDate);
          prevDate.setDate(prevDate.getDate() - 1);
          setSelectedDate(prevDate.toISOString().split('T')[0]);
        }}
        title="Previous Day"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
        className="date-input"
      />
      <button
        type="button"
        className="date-nav-btn date-nav-btn-next"
        onClick={() => {
          const nextDate = new Date(selectedDate);
          nextDate.setDate(nextDate.getDate() + 1);
          const today = new Date().toISOString().split('T')[0];
          if (nextDate.toISOString().split('T')[0] <= today) {
            setSelectedDate(nextDate.toISOString().split('T')[0]);
          }
        }}
        disabled={selectedDate >= new Date().toISOString().split('T')[0]}
        title="Next Day"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
      {selectedDate !== new Date().toISOString().split('T')[0] && (
        <button
          type="button"
          className="date-today-btn"
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          title="Go to Today"
        >
          Today
        </button>
      )}
    </div>
  </div>
  <div className="visual-chart-area">
    <div className="y-axis-labels">
      {calculateYAxisLabels().map((label, index) => (
        <span key={index}>{label}</span>
      ))}
    </div>
    <div className="bars-flex-container">
      {distribution.length > 0 && distribution.some((d) => d.count > 0) ? (
        distribution.map((item, index) => (
          <div key={index} className="single-bar-column">
            {item.count > 0 && (
              <div 
                className="actual-bar" 
                style={{ 
                  height: `${(item.count / calculateYAxisLabels()[0]) * 100}%`,
                  backgroundColor: '#10b981'
                }}
              ></div>
            )}
            <span className="bar-name">{item.name}</span>
          </div>
        ))
      ) : (
        <div className="distribution-empty-state">
          No data available for {new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      )}
    </div>
  </div>
</div>

        <div className="activity-card-full recent-activity-section">
  <h3 className="section-title">Recent Activity</h3>
  <div className="activity-scroll-list">
    {recentActivity.length > 0 ? (
      recentActivity.map((activity, index) => (
        <div key={index} className="activity-row">
          <span className="act-text">{activity.text}</span>
          <span className="act-timestamp">{activity.time}</span>
        </div>
      ))
    ) : (
      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        No recent activity
      </div>
    )}
  </div>
</div>
      </div>
    </div>
  );
};

export default AdminDash;