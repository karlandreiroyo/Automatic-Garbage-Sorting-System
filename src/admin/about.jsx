import React, { useState } from 'react';
import './admincss/about.css';

// Icons
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

const ChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const CheckCircle = ({ color = '#10b981' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const About = () => {
  const [openSections, setOpenSections] = useState({
    biodegradable: false,
    recyclable: false,
    nonBiodegradable: false,
    specs: false,
    about: false,
    team: false,
    contact: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const biodegradableExamples = [
    'Fruit and vegetable peels',
    'Coffee grounds and tea bags',
    'Eggshells and nutshells',
    'Grass clippings and leaves',
    'Paper napkins and cardboard',
    'Wood chips and sawdust'
  ];

  const nonBiodegradableExamples = [
    'Styrofoam and foam packaging',
    'Plastic bags and wrappers',
    'Batteries and electronics',
    'Light bulbs and ceramics',
    'Rubber and synthetic materials',
    'Medical and hazardous waste'
  ];

  const recyclableExamples = [
    'Plastic bottles (PET #1, HDPE #2)',
    'Glass bottles and jars',
    'Aluminum and steel cans',
    'Cardboard boxes and paper',
    'Newspapers and magazines',
    'Clean food containers'
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

  const contactEmails = [
    'royo@gmail.com',
    'arcilla@gmail.com',
    'barcelona@gmail.com',
    'gamotia@gmail.com',
    'santos@gmail.com'
  ];

  return (
    <div className="about-container">
      {/* HEADER */}
      <div className="about-header">
        <h1>
          <span className="title-dark">Automatic Garbage</span>{' '}
          <span className="title-green">Sorting System</span>
        </h1>
        <p className="about-description">
          The system improves recycling efficiency, reduces contamination, lowers labor costs, and supports environmentally friendly waste management.
        </p>
      </div>

      {/* TAGLINE */}
      <div className="tagline-section">
        <h2>Smart waste for a Cleaner Tomorrow</h2>
      </div>

      {/* WASTE TYPE CARDS */}
      <div className="waste-cards-grid">
        {/* BIODEGRADABLE CARD */}
        <div className={`waste-card ${openSections.biodegradable ? 'expanded' : ''}`}>
          <div className="waste-card-header" onClick={() => toggleSection('biodegradable')}>
            <div className="waste-card-icon green">
              <LeafIcon />
            </div>
            <div className="waste-card-content">
              <h3>Biodegradable</h3>
              <p>Organic waste that naturally decomposes</p>
            </div>
            <div className={`chevron ${openSections.biodegradable ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.biodegradable && (
            <div className="waste-card-body">
              <ul className="examples-list">
                {biodegradableExamples.map((example, index) => (
                  <li key={index}>
                    <CheckCircle color="#10b981" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RECYCLABLE CARD */}
        <div className={`waste-card ${openSections.recyclable ? 'expanded' : ''}`}>
          <div className="waste-card-header" onClick={() => toggleSection('recyclable')}>
            <div className="waste-card-icon blue">
              <RecycleIcon />
            </div>
            <div className="waste-card-content">
              <h3>Recyclable</h3>
              <p>Materials that can be processed and reused</p>
            </div>
            <div className={`chevron ${openSections.recyclable ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.recyclable && (
            <div className="waste-card-body">
              <ul className="examples-list">
                {recyclableExamples.map((example, index) => (
                  <li key={index}>
                    <CheckCircle color="#3b82f6" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* NON-BIODEGRADABLE CARD */}
        <div className={`waste-card ${openSections.nonBiodegradable ? 'expanded' : ''}`}>
          <div className="waste-card-header" onClick={() => toggleSection('nonBiodegradable')}>
            <div className="waste-card-icon gray">
              <TrashIcon />
            </div>
            <div className="waste-card-content">
              <h3>Non-Biodegradable</h3>
              <p>Waste that doesn't naturally decompose and requires special disposal methods.</p>
            </div>
            <div className={`chevron ${openSections.nonBiodegradable ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.nonBiodegradable && (
            <div className="waste-card-body">
              <ul className="examples-list">
                {nonBiodegradableExamples.map((example, index) => (
                  <li key={index}>
                    <CheckCircle color="#6b7280" />
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ACCORDION SECTIONS */}
      <div className="accordion-grid">
        {/* SPECS */}
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

        {/* ABOUT PROJECT */}
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

        {/* TEAM MEMBERS */}
        <div className="accordion-item">
          <div className="accordion-header gray" onClick={() => toggleSection('team')}>
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

        {/* CONTACT US */}
        <div className="accordion-item">
          <div className="accordion-header gray" onClick={() => toggleSection('contact')}>
            <div className="accordion-icon">
              <MailIcon />
            </div>
            <h3>Contact Us</h3>
            <div className={`chevron ${openSections.contact ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.contact && (
            <div className="accordion-content">
              <ul className="contact-list">
                {contactEmails.map((email, index) => (
                  <li key={index}>
                    <a href={`mailto:${email}`}>{email}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;

