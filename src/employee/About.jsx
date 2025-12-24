import React, { useState } from 'react';
import mainLogo from "../assets/sorting-logo.png";
import '../employee/employeecss/About.css';

// --- ICONS ---
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

// UI Icons
const ChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const CheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

// Accordion Icons
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
    cardBio: false,
    cardRecycle: false,
    cardNonBio: false,
    specs: false,
    about: false,
    team: false,
    contact: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="about-container">
      {/* WELCOME MESSAGE */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px', 
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#065F46',
          margin: 0
        }}>
          Welcome Garbage Collector Andrei!!
        </h2>
      </div>

      {/* HEADER */}
      <div className="about-header">
        <div className="title-wrapper">
          <h1>Automatic Garbage<br /><span className="highlight-green">Sorting System</span></h1>
        </div>
        <p className="about-description">
          The system improves recycling efficiency, reduces contamination, lowers labor costs, 
          and supports environmentally friendly waste management.
        </p>
      </div>

      {/* TAGLINE */}
      <div className="tagline-wrapper">
        <div className="tagline-bar"></div>
        <h2 className="tagline">Smart waste for a Cleaner Tomorrow</h2>
      </div>

      {/* WASTE TYPE CARDS */}
      <div className="cards-grid">
        {/* BIODEGRADABLE CARD */}
        <div className="waste-card">
          <div className="card-header" onClick={() => toggleSection('cardBio')}>
            <div className="card-icon-wrapper green">
              <LeafIcon />
            </div>
            <div className="card-title-section">
              <h3>Biodegradable</h3>
            </div>
            <div className={`chevron ${openSections.cardBio ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.cardBio && (
            <div className="card-content">
              <p className="card-description">
                Organic waste that naturally decomposes, including food scraps, yard waste, and paper products.
              </p>
              <ul className="feature-list">
                <li><CheckCircle /> <span>Converts to nutrient-rich compost</span></li>
                <li><CheckCircle /> <span>Decomposes in 2-6 months</span></li>
                <li><CheckCircle /> <span>Reduces landfill methane emissions</span></li>
                <li><CheckCircle /> <span>Perfect for garden fertilization</span></li>
              </ul>
            </div>
          )}
        </div>

        {/* RECYCLABLE CARD */}
        <div className="waste-card">
          <div className="card-header" onClick={() => toggleSection('cardRecycle')}>
            <div className="card-icon-wrapper blue">
              <RecycleIcon />
            </div>
            <div className="card-title-section">
              <h3>Recyclable</h3>
            </div>
            <div className={`chevron ${openSections.cardRecycle ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.cardRecycle && (
            <div className="card-content">
              <p className="card-description">
                Materials that can be processed and reused, such as plastics, glass, metals, and cardboard.
              </p>
              <ul className="feature-list">
                <li><CheckCircle /> <span>Saves up to 95% energy vs. new materials</span></li>
                <li><CheckCircle /> <span>Reduces raw material extraction</span></li>
                <li><CheckCircle /> <span>Creates jobs in recycling industry</span></li>
                <li><CheckCircle /> <span>Prevents ocean plastic pollution</span></li>
              </ul>
            </div>
          )}
        </div>

        {/* NON-BIODEGRADABLE CARD */}
        <div className="waste-card">
          <div className="card-header" onClick={() => toggleSection('cardNonBio')}>
            <div className="card-icon-wrapper gray">
              <TrashIcon />
            </div>
            <div className="card-title-section">
              <h3>Non-Biodegradable</h3>
            </div>
            <div className={`chevron ${openSections.cardNonBio ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.cardNonBio && (
            <div className="card-content">
              <p className="card-description">
                Waste that doesn't naturally decompose and requires special disposal methods.
              </p>
              <ul className="feature-list">
                <li><CheckCircle /> <span>Requires specialized disposal facilities</span></li>
                <li><CheckCircle /> <span>Prevents soil and water contamination</span></li>
                <li><CheckCircle /> <span>Proper sorting reduces toxic exposure</span></li>
                <li><CheckCircle /> <span>Encourages waste reduction habits</span></li>
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
            <div className="accordion-icon-wrapper">
              <GearIcon />
            </div>
            <h3>Specs</h3>
            <div className={`chevron ${openSections.specs ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.specs && (
            <div className="accordion-content">
              <div className="specs-grid">
                <div className="spec-item">
                  <strong>Dimensions:</strong>
                  <span>120cm x 80cm x 150cm</span>
                </div>
                <div className="spec-item">
                  <strong>Weight:</strong>
                  <span>85kg</span>
                </div>
                <div className="spec-item">
                  <strong>Power:</strong>
                  <span>220V AC, 500W</span>
                </div>
                <div className="spec-item">
                  <strong>Capacity:</strong>
                  <span>300L total (3 x 100L bins)</span>
                </div>
                <div className="spec-item">
                  <strong>Sorting Speed:</strong>
                  <span>30 items/minute</span>
                </div>
                <div className="spec-item">
                  <strong>Accuracy:</strong>
                  <span>98.2% classification rate</span>
                </div>
                <div className="spec-item">
                  <strong>Sensors:</strong>
                  <span>AI camera, ultrasonic, weight</span>
                </div>
                <div className="spec-item">
                  <strong>Connectivity:</strong>
                  <span>Wi-Fi, Bluetooth, IoT enabled</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ABOUT PROJECT */}
        <div className="accordion-item">
          <div className="accordion-header yellow" onClick={() => toggleSection('about')}>
            <div className="accordion-icon-wrapper">
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
                The Automatic Garbage Sorting System is an innovative solution designed to revolutionize 
                waste management through artificial intelligence and automation. Our system uses advanced 
                computer vision and machine learning algorithms to accurately classify waste into three 
                categories: biodegradable, recyclable, and non-biodegradable materials.
              </p>
              <p>
                By automating the sorting process, we reduce human error, increase recycling rates, and 
                minimize contamination in waste streams. The system provides real-time monitoring and 
                analytics, helping facilities optimize their waste management operations while contributing 
                to environmental sustainability.
              </p>
            </div>
          )}
        </div>

        {/* TEAM MEMBERS */}
        <div className="accordion-item">
          <div className="accordion-header cyan" onClick={() => toggleSection('team')}>
            <div className="accordion-icon-wrapper">
              <UsersIcon />
            </div>
            <h3>Team Members</h3>
            <div className={`chevron ${openSections.team ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.team && (
            <div className="accordion-content">
              <div className="team-list">
                <div className="team-member">
                  <div className="member-avatar">KR</div>
                  <div className="member-info">
                    <strong>Karl Andrei Royo</strong>
                    <span>Project Manager, Hardware, Backend</span>
                  </div>
                </div>
                <div className="team-member">
                  <div className="member-avatar">KA</div>
                  <div className="member-info">
                    <strong>Khyl Arcilla</strong>
                    <span>Lead Hardware</span>
                  </div>
                </div>
                <div className="team-member">
                  <div className="member-avatar">LB</div>
                  <div className="member-info">
                    <strong>Lei Barcelona</strong>
                    <span>Backend and Database</span>
                  </div>
                </div>
                <div className="team-member">
                  <div className="member-avatar">EG</div>
                  <div className="member-info">
                    <strong>Eugene Gamotia</strong>
                    <span>Frontend</span>
                  </div>
                </div>
                <div className="team-member">
                  <div className="member-avatar">JS</div>
                  <div className="member-info">
                    <strong>John Ivan Santos</strong>
                    <span>Frontend</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CONTACT US */}
        <div className="accordion-item">
          <div className="accordion-header pink" onClick={() => toggleSection('contact')}>
            <div className="accordion-icon-wrapper">
              <MailIcon />
            </div>
            <h3>Contact Us</h3>
            <div className={`chevron ${openSections.contact ? 'open' : ''}`}>
              <ChevronDown />
            </div>
          </div>
          {openSections.contact && (
            <div className="accordion-content">
              <div className="contact-info">
                <div className="contact-item">
                  <strong>Email:</strong>
                  <a href="mailto:info@sortingsystem.com">info@sortingsystem.com</a>
                </div>
                <div className="contact-item">
                  <strong>Phone:</strong>
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="contact-item">
                  <strong>Address:</strong>
                  <span>Bahay ni Khyl Arcilla</span>
                </div>
                <div className="contact-item">
                  <strong>Business Hours:</strong>
                  <span>Kahit Kelan pwede Sa kanila</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;