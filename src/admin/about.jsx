import React, { useState } from 'react';
import './admincss/about.css';

// Icon Components
const LeafIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

const RecycleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const CheckCircle = ({ color = '#10b981' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const ChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82V9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const MailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const PhoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const MapPinIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const About = () => {
  const [openSections, setOpenSections] = useState({
    specs: false,
    about: false,
    team: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const biodegradableFeatures = [
    'Converts to nutrient-rich compost',
    'Decomposes in 2-6 months',
    'Reduces landfill methane emissions',
    'Perfect for garden fertilization'
  ];

  const recyclableFeatures = [
    'Saves up to 95% energy vs. new materials',
    'Reduces raw material extraction',
    'Creates jobs in recycling industry',
    'Prevents ocean plastic pollution'
  ];

  const nonBiodegradableFeatures = [
    'Requires specialized disposal facilities',
    'Prevents soil and water contamination',
    'Proper sorting reduces toxic exposure',
    'Encourages waste reduction habits'
  ];

  const specsFeatures = [
    'Automatic sorting',
    'Camera and sensor based detection',
    'Indoor use',
    'Compact design'
  ];

  const teamMembers = [
    'Team Leader: Royo Karl Andrei',
    'Arcilla Khyl',
    'Barcelona Lei Andrea',
    'Gamotia Eugene Louie',
    'Santos John Ivan'
  ];

  return (
    <div className="about-container">
      <div className="about-header">
        <h1>
          <span className="title-dark">Automatic Garbage</span>{' '}
          <span className="title-green">Sorting System</span>
        </h1>
        <p className="about-description">
          The system improves recycling efficiency, reduces contamination, lowers labor costs, and supports environmentally friendly waste management.
        </p>
      </div>

      <div className="tagline-section">
        <h2>Smart waste for a Cleaner Tomorrow</h2>
      </div>

      {/* Waste Category Cards */}
      <div className="waste-cards-grid">
        <div className="waste-category-card">
          <div className="card-header green-header">
            <div className="card-icon green-icon">
              <LeafIcon />
            </div>
            <h3>Biodegradable</h3>
          </div>
          <p className="card-description">
            Organic waste that naturally decomposes, including food scraps, yard waste, and paper products.
          </p>
          <ul className="feature-list">
            {biodegradableFeatures.map((feature, index) => (
              <li key={index}>
                <CheckCircle color="#10b981" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="waste-category-card">
          <div className="card-header blue-header">
            <div className="card-icon blue-icon">
              <RecycleIcon />
            </div>
            <h3>Recyclable</h3>
          </div>
          <p className="card-description">
            Materials that can be processed and reused, such as plastics, glass, metals, and cardboard.
          </p>
          <ul className="feature-list">
            {recyclableFeatures.map((feature, index) => (
              <li key={index}>
                <CheckCircle color="#3b82f6" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="waste-category-card">
          <div className="card-header gray-header">
            <div className="card-icon gray-icon">
              <TrashIcon />
            </div>
            <h3>Non-Biodegradable</h3>
          </div>
          <p className="card-description">
            Waste that doesn't naturally decompose and requires special disposal methods.
          </p>
          <ul className="feature-list">
            {nonBiodegradableFeatures.map((feature, index) => (
              <li key={index}>
                <CheckCircle color="#6b7280" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="accordion-grid">
        <div className="accordion-item">
          <div className="accordion-header purple" onClick={() => toggleSection('specs')}>
            <div className="accordion-icon">
              <GearIcon />
            </div>
            <h3>Specs</h3>
            <div className={`chevron ${openSections.specs ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.specs && (
            <div className="accordion-content">
              <div className="specs-list">
                <h4>Main Features:</h4>
                <ul>
                  {specsFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="accordion-item">
          <div className="accordion-header orange" onClick={() => toggleSection('about')}>
            <div className="accordion-icon">
              <InfoIcon />
            </div>
            <h3>About Project</h3>
            <div className={`chevron ${openSections.about ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.about && (
            <div className="accordion-content">
              <p>
                To design and develop a small-scale automatic garbage sorting system that can efficiently separate waste into biodegradable, non-biodegradable, and recyclable materials, promoting proper waste management in schools or household environments.
              </p>
            </div>
          )}
        </div>

        <div className="accordion-item">
          <div className="accordion-header cyan" onClick={() => toggleSection('team')}>
            <div className="accordion-icon">
              <UsersIcon />
            </div>
            <h3>Team Members</h3>
            <div className={`chevron ${openSections.team ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.team && (
            <div className="accordion-content">
              <ul className="team-list">
                {teamMembers.map((member, index) => (
                  <li key={index}>{member}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="contact-section">
        <div className="contact-item">
          <div className="contact-icon teal">
            <MailIcon />
          </div>
          <div className="contact-info">
            <h4>EMAIL</h4>
            <p>info@sortingsystem.com</p>
          </div>
        </div>

        <div className="contact-item">
          <div className="contact-icon teal">
            <PhoneIcon />
          </div>
          <div className="contact-info">
            <h4>PHONE</h4>
            <p>+1 (555) 123-4567</p>
          </div>
        </div>

        <div className="contact-item">
          <div className="contact-icon teal">
            <MapPinIcon />
          </div>
          <div className="contact-info">
            <h4>ADDRESS</h4>
            <p>Brgy. 176, Bagong Silang, Caloocan City, 1428</p>
          </div>
        </div>

        <div className="contact-item">
          <div className="contact-icon teal">
            <ClockIcon />
          </div>
          <div className="contact-info">
            <h4>BUSINESS HOURS</h4>
            <p>Mon–Fri: 9AM–6PM<br />Sat: 9AM–1PM<br />Sun: Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;