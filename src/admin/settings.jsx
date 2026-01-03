import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './admincss/settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      binFullAlerts: true,
      systemErrors: true,
      weeklyReports: false
    },
    system: {
      autoSorting: true,
      maintenanceMode: false,
      dataRetention: 90,
      sortingAccuracy: 95
    },
    display: {
      theme: 'light',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90
    }
  });

  const [activeSection, setActiveSection] = useState('notifications');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Try to load settings from Supabase if you have a settings table
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', supabase.auth.getUser()?.id)
        .single();

      if (!error && data) {
        setSettings(JSON.parse(data.settings || '{}'));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleToggle = (category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const handleInputChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      // Save to Supabase if you have a settings table
      const { error } = await supabase
        .from('settings')
        .upsert({
          user_id: (await supabase.auth.getUser())?.data?.user?.id,
          settings: JSON.stringify(settings),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSaveStatus('Settings saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('Error saving settings');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        notifications: {
          emailAlerts: true,
          binFullAlerts: true,
          systemErrors: true,
          weeklyReports: false
        },
        system: {
          autoSorting: true,
          maintenanceMode: false,
          dataRetention: 90,
          sortingAccuracy: 95
        },
        display: {
          theme: 'light',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h'
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordExpiry: 90
        }
      });
      setSaveStatus('Settings reset to default');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider"></span>
    </label>
  );

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your system preferences and configurations</p>
        </div>
        <div className="settings-actions">
          <button className="btn-reset" onClick={handleReset}>Reset to Default</button>
          <button className="btn-save" onClick={handleSave}>Save Changes</button>
        </div>
      </div>

      {saveStatus && (
        <div className={`save-status ${saveStatus.includes('Error') ? 'error' : 'success'}`}>
          {saveStatus}
        </div>
      )}

      <div className="settings-layout">
        <div className="settings-sidebar">
          <div 
            className={`sidebar-item ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            <span className="sidebar-icon">🔔</span>
            <span>Notifications</span>
          </div>
          <div 
            className={`sidebar-item ${activeSection === 'system' ? 'active' : ''}`}
            onClick={() => setActiveSection('system')}
          >
            <span className="sidebar-icon">⚙️</span>
            <span>System</span>
          </div>
          <div 
            className={`sidebar-item ${activeSection === 'display' ? 'active' : ''}`}
            onClick={() => setActiveSection('display')}
          >
            <span className="sidebar-icon">🎨</span>
            <span>Display</span>
          </div>
          <div 
            className={`sidebar-item ${activeSection === 'security' ? 'active' : ''}`}
            onClick={() => setActiveSection('security')}
          >
            <span className="sidebar-icon">🔒</span>
            <span>Security</span>
          </div>
        </div>

        <div className="settings-content">
          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Settings</h2>
              <p className="section-description">Configure how and when you receive notifications</p>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Email Alerts</h3>
                  <p>Receive email notifications for important system events</p>
                </div>
                <ToggleSwitch 
                  checked={settings.notifications.emailAlerts}
                  onChange={() => handleToggle('notifications', 'emailAlerts')}
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Bin Full Alerts</h3>
                  <p>Get notified when bins reach capacity</p>
                </div>
                <ToggleSwitch 
                  checked={settings.notifications.binFullAlerts}
                  onChange={() => handleToggle('notifications', 'binFullAlerts')}
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>System Error Alerts</h3>
                  <p>Receive alerts when system errors occur</p>
                </div>
                <ToggleSwitch 
                  checked={settings.notifications.systemErrors}
                  onChange={() => handleToggle('notifications', 'systemErrors')}
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Weekly Reports</h3>
                  <p>Receive weekly summary reports via email</p>
                </div>
                <ToggleSwitch 
                  checked={settings.notifications.weeklyReports}
                  onChange={() => handleToggle('notifications', 'weeklyReports')}
                />
              </div>
            </div>
          )}

          {/* System Section */}
          {activeSection === 'system' && (
            <div className="settings-section">
              <h2>System Settings</h2>
              <p className="section-description">Configure system behavior and operations</p>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Automatic Sorting</h3>
                  <p>Enable automatic waste sorting functionality</p>
                </div>
                <ToggleSwitch 
                  checked={settings.system.autoSorting}
                  onChange={() => handleToggle('system', 'autoSorting')}
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Maintenance Mode</h3>
                  <p>Put system in maintenance mode (disables sorting)</p>
                </div>
                <ToggleSwitch 
                  checked={settings.system.maintenanceMode}
                  onChange={() => handleToggle('system', 'maintenanceMode')}
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Data Retention (Days)</h3>
                  <p>Number of days to keep historical data</p>
                </div>
                <input
                  type="number"
                  className="setting-input"
                  value={settings.system.dataRetention}
                  onChange={(e) => handleInputChange('system', 'dataRetention', parseInt(e.target.value))}
                  min="30"
                  max="365"
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Sorting Accuracy Threshold (%)</h3>
                  <p>Minimum accuracy percentage for sorting operations</p>
                </div>
                <input
                  type="number"
                  className="setting-input"
                  value={settings.system.sortingAccuracy}
                  onChange={(e) => handleInputChange('system', 'sortingAccuracy', parseInt(e.target.value))}
                  min="80"
                  max="100"
                />
              </div>
            </div>
          )}

          {/* Display Section */}
          {activeSection === 'display' && (
            <div className="settings-section">
              <h2>Display Settings</h2>
              <p className="section-description">Customize your interface preferences</p>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Theme</h3>
                  <p>Choose your preferred color theme</p>
                </div>
                <select
                  className="setting-select"
                  value={settings.display.theme}
                  onChange={(e) => handleInputChange('display', 'theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Language</h3>
                  <p>Select your preferred language</p>
                </div>
                <select
                  className="setting-select"
                  value={settings.display.language}
                  onChange={(e) => handleInputChange('display', 'language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Date Format</h3>
                  <p>Choose how dates are displayed</p>
                </div>
                <select
                  className="setting-select"
                  value={settings.display.dateFormat}
                  onChange={(e) => handleInputChange('display', 'dateFormat', e.target.value)}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Time Format</h3>
                  <p>Choose 12-hour or 24-hour time format</p>
                </div>
                <select
                  className="setting-select"
                  value={settings.display.timeFormat}
                  onChange={(e) => handleInputChange('display', 'timeFormat', e.target.value)}
                >
                  <option value="12h">12 Hour</option>
                  <option value="24h">24 Hour</option>
                </select>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <p className="section-description">Manage your account security preferences</p>
              
              <div className="setting-item">
                <div className="setting-info">
                  <h3>Two-Factor Authentication</h3>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <ToggleSwitch 
                  checked={settings.security.twoFactorAuth}
                  onChange={() => handleToggle('security', 'twoFactorAuth')}
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Session Timeout (Minutes)</h3>
                  <p>Automatically log out after inactivity</p>
                </div>
                <input
                  type="number"
                  className="setting-input"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  min="5"
                  max="120"
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h3>Password Expiry (Days)</h3>
                  <p>Number of days before password expires</p>
                </div>
                <input
                  type="number"
                  className="setting-input"
                  value={settings.security.passwordExpiry}
                  onChange={(e) => handleInputChange('security', 'passwordExpiry', parseInt(e.target.value))}
                  min="30"
                  max="365"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

