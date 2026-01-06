import React, { useState } from 'react';
import '../employee/employeecss/About.css';

// --- SVG ICONS (Styled to match Admin Screenshots) ---

const LeafIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
);
const RecycleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
);
const TrashIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
// Green Circle Checkmark
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const ChevronDown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);

// Accordion Icons
const GearIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>);
const InfoIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>);
const UsersIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>);

// Contact Icons (Styled in CSS)
const MailIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>);
const PhoneIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>);
const LocationIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>);
const ClockIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);

const About = () => {
  const [openSections, setOpenSections] = useState({
    specs: false,
    about: false,
    team: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="about-container">
      
      {/* HEADER SECTION */}
      <div className="about-header">
        <h1>Automatic Garbage <span className="highlight-green">Sorting System</span></h1>
        <p className="about-description">
          The system improves recycling efficiency, reduces contamination, lowers labor costs, 
          and supports environmentally friendly waste management.
        </p>
        <div className="tagline-wrapper">
          <h2>Smart waste for a Cleaner Tomorrow</h2>
        </div>
      </div>

      {/* WASTE TYPE CARDS (Solid Headers + Thick Border) */}
      <div className="cards-grid">
        
        {/* GREEN */}
        <div className="waste-card">
          <div className="card-header bg-green">
            <div className="header-icon-box">
              <LeafIcon />
            </div>
            <h3>Biodegradable</h3>
          </div>
          <div className="card-content">
            <p>Organic waste that naturally decomposes, including food scraps, yard waste, and paper products.</p>
            <ul className="feature-list">
              <li><div className="check-box"><CheckIcon /></div> Converts to nutrient-rich compost</li>
              <li><div className="check-box"><CheckIcon /></div> Decomposes in 2-6 months</li>
              <li><div className="check-box"><CheckIcon /></div> Reduces landfill methane emissions</li>
              <li><div className="check-box"><CheckIcon /></div> Perfect for garden fertilization</li>
            </ul>
          </div>
        </div>

        {/* BLUE */}
        <div className="waste-card">
          <div className="card-header bg-blue">
            <div className="header-icon-box">
              <RecycleIcon />
            </div>
            <h3>Recyclable</h3>
          </div>
          <div className="card-content">
            <p>Materials that can be processed and reused, such as plastics, glass, metals, and cardboard.</p>
            <ul className="feature-list">
              <li><div className="check-box"><CheckIcon /></div> Saves up to 95% energy vs. new materials</li>
              <li><div className="check-box"><CheckIcon /></div> Reduces raw material extraction</li>
              <li><div className="check-box"><CheckIcon /></div> Creates jobs in recycling industry</li>
              <li><div className="check-box"><CheckIcon /></div> Prevents ocean plastic pollution</li>
            </ul>
          </div>
        </div>

        {/* DARK */}
        <div className="waste-card">
          <div className="card-header bg-dark">
            <div className="header-icon-box">
              <TrashIcon />
            </div>
            <h3>Non-Biodegradable</h3>
          </div>
          <div className="card-content">
            <p>Waste that doesn't naturally decompose and requires special disposal methods.</p>
            <ul className="feature-list">
              <li><div className="check-box"><CheckIcon /></div> Requires specialized disposal facilities</li>
              <li><div className="check-box"><CheckIcon /></div> Prevents soil and water contamination</li>
              <li><div className="check-box"><CheckIcon /></div> Proper sorting reduces toxic exposure</li>
              <li><div className="check-box"><CheckIcon /></div> Encourages waste reduction habits</li>
            </ul>
          </div>
        </div>

      </div>

      {/* ACCORDION GRID (Pastel Colors) */}
      <div className="accordion-grid">
        
        {/* SPECS (Purple) */}
        <div className="accordion-item bg-purple">
          <div className="accordion-header" onClick={() => toggleSection('specs')}>
            <div className="acc-icon-box"><GearIcon /></div>
            <h3>Specs</h3>
            <div className={`chevron ${openSections.specs ? 'open' : ''}`}><ChevronDown /></div>
          </div>
          {openSections.specs && (
            <div className="accordion-content">
               <div className="specs-list">
                  <div className="spec-row"><strong>Dimensions:</strong> 120cm x 80cm x 150cm</div>
                  <div className="spec-row"><strong>Weight:</strong> 85kg</div>
                  <div className="spec-row"><strong>Power:</strong> 220V AC, 500W</div>
                  <div className="spec-row"><strong>Capacity:</strong> 300L total (3 x 100L bins)</div>
                  <div className="spec-row"><strong>Sorting Speed:</strong> 30 items/minute</div>
               </div>
            </div>
          )}
        </div>

        {/* ABOUT PROJECT (Orange) */}
        <div className="accordion-item bg-orange">
          <div className="accordion-header" onClick={() => toggleSection('about')}>
            <div className="acc-icon-box"><InfoIcon /></div>
            <h3>About Project</h3>
            <div className={`chevron ${openSections.about ? 'open' : ''}`}><ChevronDown /></div>
          </div>
          {openSections.about && (
            <div className="accordion-content">
              <p>The Automatic Garbage Sorting System is an innovative solution designed to revolutionize waste management through artificial intelligence and automation.</p>
            </div>
          )}
        </div>

        {/* TEAM MEMBERS (Cyan) */}
        <div className="accordion-item bg-cyan">
          <div className="accordion-header" onClick={() => toggleSection('team')}>
            <div className="acc-icon-box"><UsersIcon /></div>
            <h3>Team Members</h3>
            <div className={`chevron ${openSections.team ? 'open' : ''}`}><ChevronDown /></div>
          </div>
          {openSections.team && (
            <div className="accordion-content">
              <ul className="team-list">
                <li>Karl Andrei Royo - Project Manager</li>
                <li>Khyl Arcilla - Lead Hardware</li>
                <li>Lei Barcelona - Backend</li>
                <li>Eugene Gamotia - Frontend</li>
                <li>John Ivan Santos - Frontend</li>
              </ul>
            </div>
          )}
        </div>

      </div>

      {/* CONTACT SECTION (Pink Bar Layout) */}
      <div className="contact-section-wrapper">
        <div className="contact-grid">
          
          <div className="contact-card">
            <div className="rounded-pink-bar"></div>
            <div className="contact-content">
              <div className="contact-icon-box"><MailIcon /></div>
              <h4>EMAIL</h4>
              <p>info@sortingsystem.com</p>
            </div>
          </div>

          <div className="contact-card">
            <div className="rounded-pink-bar"></div>
            <div className="contact-content">
              <div className="contact-icon-box"><PhoneIcon /></div>
              <h4>PHONE</h4>
              <p>+1 (555) 123-4567</p>
            </div>
          </div>

          <div className="contact-card">
            <div className="rounded-pink-bar"></div>
            <div className="contact-content">
              <div className="contact-icon-box"><LocationIcon /></div>
              <h4>ADDRESS</h4>
              <p>Brgy. 176, Bagong Silang, Caloocan City, 1428</p>
            </div>
          </div>

          <div className="contact-card">
            <div className="rounded-pink-bar"></div>
            <div className="contact-content">
              <div className="contact-icon-box"><ClockIcon /></div>
              <h4>BUSINESS HOURS</h4>
              <p>Mon–Fri: 9AM–6PM<br/>Sat: 9AM–1PM<br/>Sun: Closed</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default About;