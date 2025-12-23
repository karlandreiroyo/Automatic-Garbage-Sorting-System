import React, { useState } from 'react';
import mainLogo from './assets/sorting-logo.png'; 

// --- ICONS ---
const LeafIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>;
const RecycleIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>;
const TrashIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

// UI Icons
const ChevronDown = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const CheckCircle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

// Accordion Icons
const GearIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const InfoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const UsersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const MailIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;

const About = () => {
  // Collapsible State (Only Examples and Accordions are toggleable)
  const [openSections, setOpenSections] = useState({
    cardBio: false,    // Examples for Bio
    cardRecycle: false,// Examples for Recycle
    cardNonBio: false, // Examples for Non-Bio
    specs: false,
    about: false,
    team: false,
    contact: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      <style>{`
        .about-container { max-width: 1200px; margin: 0 auto; padding: 20px 40px; font-family: 'Segoe UI', sans-serif; color: #333; padding-bottom: 60px; }
        
        .about-header { text-align: center; margin-bottom: 50px; }
        .title-wrapper { display: flex; align-items: center; justify-content: center; gap: 25px; margin-bottom: 15px; }
        .title-logo { width: 150px; height: auto; }
        .about-header h1 { font-size: 2.2rem; font-weight: 800; color: #1a1a1a; margin: 0; text-align: left; line-height: 1.2; }
        .highlight-green { color: #008751; }
        .about-description { max-width: 700px; margin: 0 auto; color: #666; font-size: 0.95rem; line-height: 1.5; }

        .section-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 30px; }
        .green-bar { width: 4px; height: 24px; background-color: #008751; border-radius: 2px; }
        .section-title { font-size: 1.2rem; font-weight: 600; color: #333; }

        /* --- CARDS STYLING --- */
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-bottom: 60px; align-items: start; }
        
        .feature-card { 
          background: #fff; padding: 30px; border-radius: 16px; border: 1px solid #f0f0f0; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.02); transition: all 0.2s; 
          display: flex; flex-direction: column;
          position: relative;
        }
        .feature-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.05); }

        /* Card Header Layout */
        .card-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        
        /* Icon Colors */
        .icon-green { color: #008751; }
        .icon-blue { color: #2563eb; }
        .icon-gray { color: #4b5563; }

        .feature-card h3 { font-size: 1.15rem; font-weight: 700; margin: 0 0 10px 0; color: #1a1a1a; }
        .feature-card p { font-size: 0.9rem; color: #555; margin-bottom: 20px; line-height: 1.6; }

        /* Check List Styling (Visible) */
        .check-list { list-style: none; padding: 0; margin: 0 0 20px 0; }
        .check-list li { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; font-size: 0.85rem; color: #4b5563; font-weight: 500; }
        
        .check-green { color: #008751; flex-shrink: 0; margin-top: 2px; }
        .check-blue { color: #2563eb; flex-shrink: 0; margin-top: 2px; }
        .check-gray { color: #4b5563; flex-shrink: 0; margin-top: 2px; }

        /* --- COLLAPSIBLE EXAMPLES SECTION --- */
        .examples-toggle-row {
          display: flex; justify-content: space-between; align-items: center; 
          padding-top: 15px; border-top: 1px solid #eee; cursor: pointer;
          color: #111; font-weight: 600; font-size: 0.95rem;
        }
        .examples-toggle-row:hover { color: #008751; }
        
        .card-chevron { transition: transform 0.3s ease; color: #9ca3af; }
        .card-chevron.open { transform: rotate(180deg); }

        /* Hidden Content Animation */
        .card-hidden-content { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-out; opacity: 0; }
        .card-hidden-content.open { max-height: 500px; opacity: 1; margin-top: 10px; }

        .examples-list { padding-left: 20px; margin: 0; color: #555; font-size: 0.9rem; line-height: 1.6; }
        .examples-list li { margin-bottom: 4px; }

        /* ACCORDIONS (Bottom) */
        .accordion-container { display: flex; flex-direction: column; gap: 16px; max-width: 900px; margin: 0 auto; }
        .accordion-item { background: #fff; border-radius: 12px; border: 1px solid #f0f0f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .accordion-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; cursor: pointer; transition: background 0.2s; user-select: none; }
        .accordion-header:hover { background: #fafafa; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .acc-icon-box { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .acc-purple { background: #f3e5f5; color: #7b1fa2; }
        .acc-yellow { background: #fff8e1; color: #fbc02d; }
        .acc-cyan { background: #e0f7fa; color: #0097a7; }
        .acc-red { background: #ffebee; color: #c62828; }
        .acc-title { font-size: 1rem; font-weight: 600; color: #333; }
        .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.4s ease-out; background: #fff; }
        .accordion-content.open { max-height: 800px; border-top: 1px solid #f0f0f0; }
        .content-inner { padding: 24px; color: #555; font-size: 0.95rem; line-height: 1.6; }
        .specs-list li { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-weight: 500; color: #4b5563; }
        .specs-list svg { color: #7c3aed; }
        .team-section h4 { margin: 0 0 12px 0; color: #00838f; font-size: 1rem; }
        .team-list { list-style: disc; padding-left: 20px; color: #555; }
        .team-list li { margin-bottom: 8px; }
        .leader { font-weight: 700; color: #006064; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .contact-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: #555; }
        .contact-row svg { color: #555; }
      `}</style>

      <div className="about-container">
        
        {/* HEADER */}
        <div className="about-header">
          <div className="title-wrapper">
            <img src={mainLogo} alt="Logo" className="title-logo" />
            <h1>Automatic Garbage<br /><span className="highlight-green">Sorting System</span></h1>
          </div>
          <p className="about-description">
            The system improves recycling efficiency, reduces contamination, lowers labor costs, 
            and supports environmentally friendly waste management.
          </p>
        </div>

        <div className="section-title-row">
          <div className="green-bar"></div>
          <div className="section-title">Smart waste for a Cleaner Tomorrow</div>
        </div>

        {/* --- CARDS GRID --- */}
        <div className="cards-grid">
          
          {/* Card 1: Biodegradable */}
          <div className="feature-card">
            <div className="card-header-top">
              <div className="icon-green"><LeafIcon /></div>
            </div>
            
            <h3>Biodegradable</h3>
            <p>Organic waste that naturally decomposes, including food scraps, yard waste, and paper products.</p>
            
            <ul className="check-list">
              <li><div className="check-green"><CheckCircle /></div> Converts to nutrient-rich compost</li>
              <li><div className="check-green"><CheckCircle /></div> Decomposes in 2-6 months</li>
              <li><div className="check-green"><CheckCircle /></div> Reduces landfill methane emissions</li>
              <li><div className="check-green"><CheckCircle /></div> Perfect for garden fertilization</li>
            </ul>
            
            {/* TOGGLE FOR EXAMPLES */}
            <div className="examples-toggle-row" onClick={() => toggleSection('cardBio')}>
              <span>Examples</span>
              <div className={`card-chevron ${openSections['cardBio'] ? 'open' : ''}`}><ChevronDown /></div>
            </div>

            {/* HIDDEN EXAMPLES LIST */}
            <div className={`card-hidden-content ${openSections['cardBio'] ? 'open' : ''}`}>
              <ul className="examples-list">
                <li>Fruit and vegetable peels</li>
                <li>Coffee grounds and tea bags</li>
                <li>Eggshells and nutshells</li>
                <li>Grass clippings and leaves</li>
                <li>Paper napkins and cardboard</li>
                <li>Wood chips and sawdust</li>
              </ul>
            </div>
          </div>

          {/* Card 2: Recyclable */}
          <div className="feature-card">
            <div className="card-header-top">
              <div className="icon-blue"><RecycleIcon /></div>
            </div>
            
            <h3>Recyclable</h3>
            <p>Materials that can be processed and reused, such as plastics, glass, metals, and cardboard.</p>
            
            <ul className="check-list">
              <li><div className="check-blue"><CheckCircle /></div> Saves up to 95% energy vs. new materials</li>
              <li><div className="check-blue"><CheckCircle /></div> Reduces raw material extraction</li>
              <li><div className="check-blue"><CheckCircle /></div> Creates jobs in recycling industry</li>
              <li><div className="check-blue"><CheckCircle /></div> Prevents ocean plastic pollution</li>
            </ul>

            <div className="examples-toggle-row" onClick={() => toggleSection('cardRecycle')}>
              <span>Examples</span>
              <div className={`card-chevron ${openSections['cardRecycle'] ? 'open' : ''}`}><ChevronDown /></div>
            </div>

            <div className={`card-hidden-content ${openSections['cardRecycle'] ? 'open' : ''}`}>
              <ul className="examples-list">
                <li>Plastic bottles (PET #1, HDPE #2)</li>
                <li>Glass bottles and jars</li>
                <li>Aluminum and steel cans</li>
                <li>Cardboard boxes and paper</li>
                <li>Newspapers and magazines</li>
                <li>Clean food containers</li>
              </ul>
            </div>
          </div>

          {/* Card 3: Non-Biodegradable */}
          <div className="feature-card">
            <div className="card-header-top">
              <div className="icon-gray"><TrashIcon /></div>
            </div>
            
            <h3>Non-Biodegradable</h3>
            <p>Waste that doesn't naturally decompose and requires special disposal methods.</p>
            
            <ul className="check-list">
              <li><div className="check-gray"><CheckCircle /></div> Requires specialized disposal facilities</li>
              <li><div className="check-gray"><CheckCircle /></div> Prevents soil and water contamination</li>
              <li><div className="check-gray"><CheckCircle /></div> Proper sorting reduces toxic exposure</li>
              <li><div className="check-gray"><CheckCircle /></div> Encourages waste reduction habits</li>
            </ul>

            <div className="examples-toggle-row" onClick={() => toggleSection('cardNonBio')}>
              <span>Examples</span>
              <div className={`card-chevron ${openSections['cardNonBio'] ? 'open' : ''}`}><ChevronDown /></div>
            </div>

            <div className={`card-hidden-content ${openSections['cardNonBio'] ? 'open' : ''}`}>
              <ul className="examples-list">
                <li>Styrofoam and foam packaging</li>
                <li>Plastic bags and wrappers</li>
                <li>Batteries and electronics</li>
                <li>Light bulbs and ceramics</li>
                <li>Rubber and synthetic materials</li>
                <li>Medical and hazardous waste</li>
              </ul>
            </div>
          </div>
        </div>

        {/* --- BOTTOM ACCORDIONS --- */}
        <div className="accordion-container">
          <div className="accordion-item">
            <div className="accordion-header" onClick={() => toggleSection('specs')}>
              <div className="header-left">
                <div className="acc-icon-box acc-purple"><GearIcon /></div>
                <span className="acc-title">Specs</span>
              </div>
              <div className={`card-chevron ${openSections['specs'] ? 'open' : ''}`}><ChevronDown /></div>
            </div>
            <div className={`accordion-content ${openSections['specs'] ? 'open' : ''}`}>
              <div className="content-inner">
                <h4 style={{marginTop:0, marginBottom:'15px'}}>Main Features:</h4>
                <ul className="specs-list" style={{listStyle:'none', padding:0}}>
                  <li><CheckCircle /> Automatic sorting</li>
                  <li><CheckCircle /> Camera and sensor based detection</li>
                  <li><CheckCircle /> Indoor use</li>
                  <li><CheckCircle /> Compact design</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <div className="accordion-header" onClick={() => toggleSection('about')}>
              <div className="header-left">
                <div className="acc-icon-box acc-yellow"><InfoIcon /></div>
                <span className="acc-title">About Project</span>
              </div>
              <div className={`card-chevron ${openSections['about'] ? 'open' : ''}`}><ChevronDown /></div>
            </div>
            <div className={`accordion-content ${openSections['about'] ? 'open' : ''}`}>
              <div className="content-inner">
                <p>
                  To design and develop a small-scale automatic garbage sorting system that can efficiently 
                  separate waste into biodegradable, non-biodegradable, and recyclable materials, 
                  promoting proper waste management in schools or household environments.
                </p>
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <div className="accordion-header" onClick={() => toggleSection('team')}>
              <div className="header-left">
                <div className="acc-icon-box acc-cyan"><UsersIcon /></div>
                <span className="acc-title">Team Members</span>
              </div>
              <div className={`card-chevron ${openSections['team'] ? 'open' : ''}`}><ChevronDown /></div>
            </div>
            <div className={`accordion-content ${openSections['team'] ? 'open' : ''}`}>
              <div className="content-inner team-section">
                <div className="leader">Team Leader: Royo Karl Andrei</div>
                <ul className="team-list">
                  <li>Arcilla Khyl</li>
                  <li>Barcelona Lei Andrea</li>
                  <li>Gamotia Eugene Louie</li>
                  <li>Santos John Ivan</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <div className="accordion-header" onClick={() => toggleSection('contact')}>
              <div className="header-left">
                <div className="acc-icon-box acc-red"><MailIcon /></div>
                <span className="acc-title">Contact Us</span>
              </div>
              <div className={`card-chevron ${openSections['contact'] ? 'open' : ''}`}><ChevronDown /></div>
            </div>
            <div className={`accordion-content ${openSections['contact'] ? 'open' : ''}`}>
              <div className="content-inner">
                <div className="contact-row"><MailIcon /> royo@gmail.com</div>
                <div className="contact-row"><MailIcon /> arcilla@gmail.com</div>
                <div className="contact-row"><MailIcon /> barcelona@gmail.com</div>
                <div className="contact-row"><MailIcon /> gamotia@gmail.com</div>
                <div className="contact-row"><MailIcon /> santos@gmail.com</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default About;