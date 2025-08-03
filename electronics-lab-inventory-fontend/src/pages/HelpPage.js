// src/pages/HelpPage.js
import React, { useState, useContext } from 'react';
import { 
  MdHelp, 
  MdExpandMore, 
  MdExpandLess, 
  MdSearch, 
  MdInventory, 
  MdPeople, 
  MdSmartToy, 
  MdBarChart, 
  MdBook, 
  MdVideoLibrary, 
  MdContactSupport,
  MdEmail,
  MdPhone,
  MdChat,
  MdLightbulb,
  MdSecurity,
  MdSettings,
  MdBugReport,
  MdFeedback,
  MdQuestionAnswer,
  MdArrowForward,
  MdKeyboardArrowRight
} from 'react-icons/md';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AuthContext from '../contexts/AuthContext';
import './HelpPage.css';

const HelpPage = () => {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  // FAQ Data (keeping all the existing FAQ data - unchanged)
  const faqData = {
    'getting-started': [
      {
        question: "How do I add a new component to inventory?",
        answer: "Navigate to the Inventory page and click the 'Add Component' button. Fill in the required details like component name, part number, category, quantity, and location. Click 'Save' to add the component to your inventory."
      },
      {
        question: "How do I search for components?",
        answer: "Use the search bar on the Inventory page to search by component name, part number, or category. You can also use filters to narrow down results by status, location, or quantity range."
      },
      {
        question: "What are the different user roles?",
        answer: "The system has several roles: Admin (full access), User (basic inventory access), Lab Technician (lab-specific features), Researcher (research tools), and Manufacturing Engineer (production features)."
      }
    ],
    'inventory': [
      {
        question: "How do I update stock levels?",
        answer: "Click on a component in the inventory list, then use the 'Inward Stock' button to add stock or 'Outward Stock' button to remove stock. Enter the quantity and reason for the transaction."
      },
      {
        question: "What does 'Low Stock' mean?",
        answer: "Components marked as 'Low Stock' have quantities below their minimum threshold. These items appear with a warning badge and should be restocked soon."
      },
      {
        question: "How do I export inventory data?",
        answer: "On the Inventory page, click the 'Export CSV' button to download a spreadsheet with all your inventory data including component details, quantities, and locations."
      },
      {
        question: "Can I bulk import components?",
        answer: "Currently, bulk import is not available through the UI. Contact your system administrator for bulk import options using CSV files."
      }
    ],
    'users': [
      {
        question: "How do I change user permissions?",
        answer: "Only administrators can modify user permissions. Go to the User Management page, click the edit button next to a user, and select their new role from the dropdown."
      },
      {
        question: "How do I reset a user's password?",
        answer: "Password reset functionality is handled through the login page. Users can click 'Forgot Password' to receive reset instructions via email."
      },
      {
        question: "How do I deactivate a user account?",
        answer: "Administrators can deactivate users from the User Management page by clicking the deactivate button next to the user's name. Deactivated users cannot log in but their data is preserved."
      }
    ],
    'reports': [
      {
        question: "How do I generate inventory reports?",
        answer: "Visit the Dashboard page to view various reports including monthly transaction summaries, low stock alerts, and inventory value calculations. Reports update automatically based on your current data."
      },
      {
        question: "Can I schedule automatic reports?",
        answer: "Automatic report scheduling is not currently available. You can manually export data and generate reports as needed."
      }
    ],
    'assistant': [
      {
        question: "How does the AI Assistant work?",
        answer: "The Personal Assistant uses AI to help you with inventory questions, account information, and system guidance. Simply type your question in natural language and get instant responses."
      },
      {
        question: "What can I ask the Assistant?",
        answer: "You can ask about your inventory levels, component details, account status, system features, or request recommendations for electronics projects. The assistant has access to your account data to provide personalized responses."
      },
      {
        question: "Is the Assistant available 24/7?",
        answer: "Yes, the AI Assistant is available whenever you're logged into the system. It provides instant responses to help you navigate and use the platform effectively."
      }
    ],
    'troubleshooting': [
      {
        question: "I can't log in to my account",
        answer: "First, verify your email and password are correct. If you've forgotten your password, use the 'Forgot Password' link. If issues persist, contact your system administrator."
      },
      {
        question: "The page is loading slowly",
        answer: "Slow loading can be caused by network issues or large datasets. Try refreshing the page, clearing your browser cache, or reducing the number of items displayed per page."
      },
      {
        question: "I'm getting access denied errors",
        answer: "Access denied errors occur when you don't have permission for certain features. Contact your administrator to verify your user role and permissions."
      },
      {
        question: "Data is not updating correctly",
        answer: "Try refreshing the page first. If data still appears incorrect, log out and log back in. For persistent issues, contact technical support."
      }
    ]
  };

  // Help Categories
  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: MdLightbulb, color: '#10b981' },
    { id: 'inventory', name: 'Inventory Management', icon: MdInventory, color: '#3b82f6' },
    { id: 'users', name: 'User Management', icon: MdPeople, color: '#8b5cf6' },
    { id: 'reports', name: 'Reports & Analytics', icon: MdBarChart, color: '#f59e0b' },
    { id: 'assistant', name: 'AI Assistant', icon: MdSmartToy, color: '#ef4444' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: MdBugReport, color: '#6b7280' }
  ];

  // Filter FAQs based on search
  const filteredFAQs = faqData[activeCategory]?.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="help-page-wrapper">
      
        <Sidebar />
      
      <div className="help-main-content-area">
        <div className="help-navbar-container">
          <Navbar />
        </div>
        
        <div className="help-content">
          <div className="help-page-container">
            {/* Enhanced Header Section */}
            <div className="help-page-header">
              <div className="help-header-content">
                <div className="help-header-left">
                  <div className="help-title-container">
                    <div className="help-title-icon">
                      <MdHelp />
                    </div>
                    <div className="help-title-section">
                      <h1 className="help-page-title">Help Center</h1>
                      <p className="help-page-subtitle">Find answers to your questions and learn how to use the system</p>
                    </div>
                  </div>
                </div>
                <div className="help-search-section">
                  <div className="help-search-container">
                    <MdSearch className="help-search-icon" />
                    <input
                      type="text"
                      placeholder="Search help articles and FAQs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="help-search-input"
                    />
                  </div>
                </div>
                <div className="help-button-section">
                  <button className="help-contact-button">
                    <MdContactSupport className="help-button-icon" />
                    <span>Contact Support</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="help-main-content">
              {/* Categories Sidebar */}
              <div className="help-categories-panel">
                <h3 className="help-categories-title">Help Categories</h3>
                <div className="help-categories-list">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`help-category-button ${activeCategory === category.id ? 'help-category-button-active' : ''}`}
                      >
                        <div 
                          className="help-category-icon"
                          style={{
                            background: `${category.color}15`,
                            color: category.color
                          }}
                        >
                          <IconComponent />
                        </div>
                        <span className="help-category-name">{category.name}</span>
                        <MdKeyboardArrowRight className="help-category-arrow" />
                      </button>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="help-quick-actions">
                  <h4 className="help-quick-actions-title">Quick Actions</h4>
                  <div className="help-quick-actions-list">
                    <button className="help-quick-action-button">
                      <MdVideoLibrary className="help-quick-action-icon" />
                      <span>Video Tutorials</span>
                    </button>
                    <button className="help-quick-action-button">
                      <MdFeedback className="help-quick-action-icon" />
                      <span>Send Feedback</span>
                    </button>
                    <button className="help-quick-action-button">
                      <MdBugReport className="help-quick-action-icon" />
                      <span>Report Bug</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* FAQ Content */}
              <div className="help-content-panel">
                <div className="help-content-header">
                  <h2 className="help-content-title">
                    {categories.find(cat => cat.id === activeCategory)?.name}
                  </h2>
                  <p className="help-content-subtitle">
                    {filteredFAQs.length} article{filteredFAQs.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                {/* FAQ List */}
                <div className="help-faq-container">
                  {filteredFAQs.length > 0 ? (
                    filteredFAQs.map((faq, index) => (
                      <div key={index} className="help-faq-item">
                        <button
                          onClick={() => toggleFAQ(index)}
                          className="help-faq-question"
                        >
                          <span className="help-faq-question-text">{faq.question}</span>
                          <div className="help-faq-toggle">
                            {expandedFAQ === index ? <MdExpandLess /> : <MdExpandMore />}
                          </div>
                        </button>
                        
                        {expandedFAQ === index && (
                          <div className="help-faq-answer">
                            <p className="help-faq-answer-text">{faq.answer}</p>
                            <div className="help-faq-helpful">
                              <span className="help-helpful-text">Was this helpful?</span>
                              <div className="help-helpful-buttons">
                                <button className="help-helpful-button">👍 Yes</button>
                                <button className="help-helpful-button">👎 No</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="help-no-results">
                      <MdSearch className="help-no-results-icon" />
                      <h3>No articles found</h3>
                      <p>Try searching with different keywords or browse categories.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Contact Section */}
            <div className="help-contact-section">
              <div className="help-contact-header">
                <h2 className="help-contact-title">Still Need Help?</h2>
                <p className="help-contact-subtitle">Our support team is here to help you succeed</p>
              </div>
              
              <div className="help-contact-options">
                <div className="help-contact-card">
                  <div className="help-contact-icon">
                    <MdEmail />
                  </div>
                  <h3 className="help-contact-method">Email Support</h3>
                  <p className="help-contact-description">Get detailed help via email</p>
                  <p className="help-contact-info">support@yourcompany.com</p>
                  <button className="help-contact-action-button">
                    Send Email
                    <MdArrowForward className="help-contact-button-icon" />
                  </button>
                </div>

                <div className="help-contact-card">
                  <div className="help-contact-icon">
                    <MdChat />
                  </div>
                  <h3 className="help-contact-method">Live Chat</h3>
                  <p className="help-contact-description">Chat with our support team</p>
                  <p className="help-contact-info">Available 9 AM - 6 PM</p>
                  <button className="help-contact-action-button">
                    Start Chat
                    <MdArrowForward className="help-contact-button-icon" />
                  </button>
                </div>

                <div className="help-contact-card">
                  <div className="help-contact-icon">
                    <MdPhone />
                  </div>
                  <h3 className="help-contact-method">Phone Support</h3>
                  <p className="help-contact-description">Speak directly with support</p>
                  <p className="help-contact-info">+1 (555) 123-4567</p>
                  <button className="help-contact-action-button">
                    Call Now
                    <MdArrowForward className="help-contact-button-icon" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
