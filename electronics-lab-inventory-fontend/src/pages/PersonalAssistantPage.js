// src/pages/PersonalAssistantPage.js
import React, { useState, useRef, useContext, useEffect } from 'react';
import { MdSend, MdPerson, MdSmartToy, MdRefresh, MdExpandMore, MdExpandLess, MdMic, MdStop } from 'react-icons/md';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AuthContext from '../contexts/AuthContext';
import api from '../utils/api';

// Import React Markdown and its plugin
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const WELCOME_MESSAGES = [
  "Hi! How can I help with your electronics today?",
  "Ask me anything about your account, orders, or parts.",
  "I'm your personal electronics assistant here to guide you."
];

const SUGGESTED_QUESTIONS = [
  "What components do I have in stock?",
  "Show me my recent orders",
  "Help me find resistors",
  "What's my account status?",
  "Recommend components for Arduino project"
];

function PersonalAssistantPage() {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      from: 'assistant',
      text: WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)],
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const pushMessage = (from, text) => setMessages(msgs => ([...msgs, { from, text, time: new Date() }]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');
    setError(null);
    setShowSuggestions(false);
    pushMessage('user', userText);

    setLoading(true);
    
    // Animated typing effect
    const typingTexts = ['Thinking...', 'Processing...', 'Analyzing...'];
    let index = 0;
    const typingInterval = setInterval(() => {
      setTypingIndicator(typingTexts[index % typingTexts.length]);
      index++;
    }, 500);

    try {
      await new Promise(res => setTimeout(res, 500));
      const res = await api.post('/assistant', {
        message: userText,
        chat: messages.map(m => ({ from: m.from, text: m.text })),
        userDetails: {
          id: user?._id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
          preferences: user?.preferences,
        }
      });
      let reply = (res.data?.output || res.data?.response || res.data)?.toString().trim();
      if (!reply) reply = "Sorry, I couldn't find an answer. Please try rephrasing.";
      
      clearInterval(typingInterval);
      setTypingIndicator('');
      pushMessage('assistant', reply);
    } catch (err) {
      clearInterval(typingInterval);
      setTypingIndicator('');
      setError('Sorry, there was a problem reaching the assistant. Please try again.');
    }
    setLoading(false);
  };

  const handleClear = () => {
    setMessages([
      {
        from: 'assistant',
        text: WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)],
        time: new Date()
      }
    ]);
    setError(null);
    setInput('');
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    } else if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    const parts = user.name.trim().split(" ");
    return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
  };

  return (
    <div className="personal-assistant-page-wrapper" style={assistantStyles.appContainer}>
      <div style={assistantStyles.sidebarContainer}>
        <Sidebar />
      </div>
      <div style={assistantStyles.mainContentArea}>
        <div style={assistantStyles.navbarContainer}>
          <Navbar />
        </div>
        
        <div style={assistantStyles.assistantContent}>
          <div style={assistantStyles.pageContainer}>
            <div style={assistantStyles.chatContainer}>
              {/* Animated Background Elements */}
              <div style={assistantStyles.backgroundElement1}></div>
              <div style={assistantStyles.backgroundElement2}></div>
              <div style={assistantStyles.backgroundElement3}></div>

              {/* Header */}
              <div style={assistantStyles.header}>
                <div style={assistantStyles.headerContent}>
                  <div style={assistantStyles.assistantIcon}>
                    <MdSmartToy />
                  </div>
                  <div>
                    <h1 style={assistantStyles.title}>Personal Assistant</h1>
                    <p style={assistantStyles.subtitle}>Powered by AI • Here to help with your electronics</p>
                  </div>
                </div>
                
                {user && (
                  <div style={assistantStyles.userInfo}>
                    <div style={assistantStyles.userAvatar}>
                      {getUserInitials()}
                    </div>
                    <span>Chatting as {user.name}</span>
                    <div style={assistantStyles.onlineIndicator}></div>
                  </div>
                )}
              </div>

              {/* Chat Area */}
              <div style={assistantStyles.chatArea}>
                {/* Messages History */}
                <div className="assistant-chat-history" style={assistantStyles.messagesContainer}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{
                      ...assistantStyles.messageWrapper,
                      flexDirection: msg.from === 'user' ? 'row-reverse' : 'row',
                      animation: `assistantSlideIn 0.3s ease-out ${i * 0.1}s both`
                    }}>
                      <div style={{
                        ...assistantStyles.avatar,
                        background: msg.from === 'user' 
                          ? 'linear-gradient(135deg, #667eea, #764ba2)'
                          : 'linear-gradient(135deg, #8b5cf6, #a855f7)'
                      }}>
                        {msg.from === 'user' ? (
                          <span style={assistantStyles.userInitials}>{getUserInitials()}</span>
                        ) : (
                          <MdSmartToy />
                        )}
                      </div>
                      
                      <div style={{
                        ...assistantStyles.messageBubble,
                        background: msg.from === 'user'
                          ? 'linear-gradient(135deg, #667eea, #764ba2)'
                          : 'white',
                        color: msg.from === 'user' ? 'white' : '#374151',
                        borderRadius: msg.from === 'user' 
                          ? '20px 20px 4px 20px'
                          : '4px 20px 20px 20px'
                      }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                        <div style={{
                          ...assistantStyles.timestamp,
                          textAlign: msg.from === 'user' ? 'right' : 'left'
                        }}>
                          {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {loading && (
                    <div style={assistantStyles.loadingWrapper}>
                      <div style={assistantStyles.loadingAvatar}>
                        <MdSmartToy />
                      </div>
                      <div style={assistantStyles.loadingBubble}>
                        <div style={assistantStyles.typingAnimation}>
                          <div style={assistantStyles.typingDots}>
                            <div style={{...assistantStyles.dot, animationDelay: '0s'}}></div>
                            <div style={{...assistantStyles.dot, animationDelay: '0.2s'}}></div>
                            <div style={{...assistantStyles.dot, animationDelay: '0.4s'}}></div>
                          </div>
                          <span>{typingIndicator || 'Typing...'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef}></div>
                </div>

                {/* Suggestions */}
                {showSuggestions && messages.length === 1 && (
                  <div style={assistantStyles.suggestionsContainer}>
                    <div style={assistantStyles.suggestionsHeader} onClick={() => setShowSuggestions(!showSuggestions)}>
                      <span>Suggested questions</span>
                      {showSuggestions ? <MdExpandLess /> : <MdExpandMore />}
                    </div>
                    <div style={assistantStyles.suggestionsGrid}>
                      {SUGGESTED_QUESTIONS.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(suggestion)}
                          style={assistantStyles.suggestionButton}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, #8b5cf6, #a855f7)';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1))';
                            e.target.style.color = '#667eea';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div style={assistantStyles.inputArea}>
                  <form onSubmit={handleSubmit} style={assistantStyles.inputForm}>
                    <div style={assistantStyles.inputWrapper}>
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ask me anything about electronics, your account, or orders..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        disabled={loading}
                        style={assistantStyles.textInput}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#8b5cf6';
                          e.target.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'transparent';
                          e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                        }}
                      />
                      
                      {/* Voice input button */}
                      {'webkitSpeechRecognition' in window && (
                        <button
                          type="button"
                          onClick={handleVoiceInput}
                          style={{
                            ...assistantStyles.voiceButton,
                            background: isListening 
                              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                              : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                            animation: isListening ? 'assistantPulse 1s ease-in-out infinite' : 'none'
                          }}
                        >
                          {isListening ? <MdStop size={16} /> : <MdMic size={16} />}
                        </button>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      style={{
                        ...assistantStyles.sendButton,
                        background: loading || !input.trim() 
                          ? 'linear-gradient(135deg, #d1d5db, #9ca3af)'
                          : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                        cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading && input.trim()) {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.3)';
                      }}
                    >
                      <MdSend />
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={loading}
                      style={{
                        ...assistantStyles.clearButton,
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.transform = 'scale(1.1)';
                          e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.3)';
                      }}
                    >
                      <MdRefresh />
                    </button>
                  </form>
                  
                  {error && (
                    <div style={assistantStyles.errorMessage}>
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CSS Animations */}
        <style>{personalAssistantCSS}</style>
      </div>
    </div>
  );
}

// Unique styles object for personal assistant page only
const assistantStyles = {
  // Main Layout Container - Unique to assistant page
  appContainer: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f8fafc'
  },

  // Sticky Sidebar Container
  sidebarContainer: {
    position: 'sticky',
    top: 0,
    left: 0,
    height: '100vh',
    width: '260px',
    flexShrink: 0,
    zIndex: 1000,
    backgroundColor: 'white',
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
    borderRight: '1px solid #e2e8f0'
  },

  // Main Content Area
  mainContentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100vh',
    overflow: 'hidden'
  },

  // Sticky Navbar Container  
  navbarContainer: {
    position: 'sticky',
    top: 0,
    width: '100%',
    height: '64px',
    flexShrink: 0,
    zIndex: 999,
    backgroundColor: 'white',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
  },

  // Scrollable Assistant Content
  assistantContent: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    width: '100%',
    minHeight: 0,
    scrollBehavior: 'smooth',
    // Custom scrollbar for assistant content
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 #f1f5f9'
  },

  pageContainer: {
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  chatContainer: {
    width: '100%',
    maxWidth: '900px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    position: 'relative'
  },

  backgroundElement1: {
    position: 'absolute',
    top: '-50px',
    right: '-50px',
    width: '200px',
    height: '200px',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1))',
    borderRadius: '50%',
    animation: 'assistantFloat 6s ease-in-out infinite',
    zIndex: 0
  },

  backgroundElement2: {
    position: 'absolute',
    bottom: '-30px',
    left: '-30px',
    width: '150px',
    height: '150px',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
    borderRadius: '50%',
    animation: 'assistantFloat 8s ease-in-out infinite reverse',
    zIndex: 0
  },

  backgroundElement3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '300px',
    height: '300px',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(168, 85, 247, 0.05))',
    borderRadius: '50%',
    animation: 'assistantFloat 10s ease-in-out infinite',
    zIndex: 0
  },

  header: {
    padding: '30px 40px 20px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
    borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
    position: 'relative',
    zIndex: 1
  },

  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '8px'
  },

  assistantIcon: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '24px',
    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
    animation: 'assistantPulse 2s ease-in-out infinite'
  },

  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  subtitle: {
    margin: '4px 0 0',
    color: '#6b7280',
    fontSize: '14px'
  },

  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#6b7280'
  },

  userAvatar: {
    width: '20px',
    height: '20px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '10px',
    fontWeight: '600'
  },

  onlineIndicator: {
    width: '6px',
    height: '6px',
    background: '#10b981',
    borderRadius: '50%',
    animation: 'assistantPulse 2s ease-in-out infinite'
  },

  chatArea: {
    height: '500px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1
  },

  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 #f1f5f9'
  },

  messageWrapper: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    alignItems: 'flex-start'
  },

  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
    flexShrink: 0
  },

  userInitials: {
    fontSize: '12px',
    fontWeight: '600'
  },

  messageBubble: {
    maxWidth: '70%',
    padding: '16px 20px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    fontSize: '15px',
    lineHeight: '1.5'
  },

  timestamp: {
    fontSize: '12px',
    opacity: 0.7,
    marginTop: '8px'
  },

  loadingWrapper: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    alignItems: 'flex-end'
  },

  loadingAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px',
    animation: 'assistantPulse 1s ease-in-out infinite'
  },

  loadingBubble: {
    background: 'white',
    padding: '16px 20px',
    borderRadius: '4px 20px 20px 20px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
  },

  typingAnimation: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#8b5cf6',
    fontStyle: 'italic'
  },

  typingDots: {
    display: 'flex',
    gap: '2px'
  },

  dot: {
    width: '6px',
    height: '6px',
    background: '#8b5cf6',
    borderRadius: '50%',
    animation: 'assistantBounce 1.4s ease-in-out infinite both'
  },

  suggestionsContainer: {
    padding: '0 20px 20px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
  },

  suggestionsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    cursor: 'pointer',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500'
  },

  suggestionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },

  suggestionButton: {
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1))',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '13px',
    color: '#667eea',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500'
  },

  inputArea: {
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(139, 92, 246, 0.1)'
  },

  inputForm: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end'
  },

  inputWrapper: {
    flex: 1,
    position: 'relative'
  },

  textInput: {
    width: '100%',
    padding: '16px 50px 16px 20px',
    border: '2px solid transparent',
    borderRadius: '24px',
    fontSize: '15px',
    outline: 'none',
    background: 'white',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box'
  },

  voiceButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '50%',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },

  sendButton: {
    width: '50px',
    height: '50px',
    border: 'none',
    borderRadius: '50%',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontSize: '20px',
    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)'
  },

  clearButton: {
    width: '50px',
    height: '50px',
    border: 'none',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontSize: '20px',
    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
  },

  errorMessage: {
    marginTop: '12px',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
    color: '#dc2626',
    borderRadius: '12px',
    border: '1px solid #fecaca',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center',
    animation: 'assistantShake 0.5s ease-in-out'
  }
};

// CSS Animations as a string - unique to assistant page
const personalAssistantCSS = `
  /* Unique animations for assistant page */
  @keyframes assistantPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
  }
  
  @keyframes assistantBounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-10px); opacity: 1; }
  }
  
  @keyframes assistantSlideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes assistantFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes assistantShake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  /* Assistant page specific scrollbar styles */
  .personal-assistant-page-wrapper .assistantContent::-webkit-scrollbar {
    width: 12px;
  }
  
  .personal-assistant-page-wrapper .assistantContent::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 6px;
  }
  
  .personal-assistant-page-wrapper .assistantContent::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    border-radius: 6px;
    border: 2px solid #f1f5f9;
  }
  
  .personal-assistant-page-wrapper .assistantContent::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #7c3aed, #9333ea);
  }
  
  /* Chat history scrollbar styles */
  .personal-assistant-page-wrapper .assistant-chat-history::-webkit-scrollbar {
    width: 6px;
  }
  
  .personal-assistant-page-wrapper .assistant-chat-history::-webkit-scrollbar-track {
    background: rgba(139, 92, 246, 0.1);
    border-radius: 3px;
  }
  
  .personal-assistant-page-wrapper .assistant-chat-history::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    border-radius: 3px;
  }
  
  .personal-assistant-page-wrapper .assistant-chat-history::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #7c3aed, #9333ea);
  }

  /* Markdown styles for message bubbles - scoped to assistant page */
  .personal-assistant-page-wrapper .message-bubble strong {
    font-weight: 700;
    color: inherit;
  }

  .personal-assistant-page-wrapper .message-bubble em {
    font-style: italic;
  }

  .personal-assistant-page-wrapper .message-bubble ul,
  .personal-assistant-page-wrapper .message-bubble ol {
    padding-left: 20px;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .personal-assistant-page-wrapper .message-bubble li {
    margin-bottom: 4px;
  }

  .personal-assistant-page-wrapper .message-bubble p {
    margin-bottom: 8px;
  }

  .personal-assistant-page-wrapper .message-bubble p:last-child {
    margin-bottom: 0;
  }
  
  .personal-assistant-page-wrapper .message-bubble h1, 
  .personal-assistant-page-wrapper .message-bubble h2, 
  .personal-assistant-page-wrapper .message-bubble h3, 
  .personal-assistant-page-wrapper .message-bubble h4, 
  .personal-assistant-page-wrapper .message-bubble h5, 
  .personal-assistant-page-wrapper .message-bubble h6 {
    color: inherit;
    margin-top: 1em;
    margin-bottom: 0.5em;
    line-height: 1.2;
  }
  
  .personal-assistant-page-wrapper .message-bubble h1 { font-size: 1.5em; }
  .personal-assistant-page-wrapper .message-bubble h2 { font-size: 1.3em; }
  .personal-assistant-page-wrapper .message-bubble h3 { font-size: 1.1em; }

  .personal-assistant-page-wrapper .message-bubble pre {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    padding: 10px;
    overflow-x: auto;
    font-family: monospace;
    font-size: 0.9em;
    margin-top: 10px;
    margin-bottom: 10px;
    color: #333;
  }

  .personal-assistant-page-wrapper .message-bubble code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
    color: #333;
  }

  .personal-assistant-page-wrapper .message-bubble table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 0.9em;
  }

  .personal-assistant-page-wrapper .message-bubble th, 
  .personal-assistant-page-wrapper .message-bubble td {
    border: 1px solid rgba(0,0,0,0.1);
    padding: 8px;
    text-align: left;
  }

  .personal-assistant-page-wrapper .message-bubble th {
    background-color: rgba(0,0,0,0.03);
    font-weight: 600;
  }

  /* Hover effects for assistant page only */
  .personal-assistant-page-wrapper button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  /* Responsive styles for assistant page only */
  @media (max-width: 768px) {
    .personal-assistant-page-wrapper .assistantContent {
      padding: 16px;
    }
    
    .personal-assistant-page-wrapper .sidebarContainer {
      width: 240px;
    }
    
    .personal-assistant-page-wrapper .message-bubble {
      max-width: 85% !important;
    }
    
    .personal-assistant-page-wrapper .chatContainer {
      margin: 10px !important;
      border-radius: 16px !important;
    }
    
    .personal-assistant-page-wrapper .header {
      padding: 20px 24px 16px !important;
    }
    
    .personal-assistant-page-wrapper .inputArea {
      padding: 16px !important;
    }
  }

  @media (max-width: 480px) {
    .personal-assistant-page-wrapper .assistantContent {
      padding: 12px;
    }
    
    .personal-assistant-page-wrapper .sidebarContainer {
      width: 220px;
    }
  }
`;

// Only add stylesheet if it doesn't exist
const assistantStyleSheet = document.createElement('style');
if (!document.querySelector('#personal-assistant-page-styles')) {
  assistantStyleSheet.id = 'personal-assistant-page-styles';
  assistantStyleSheet.innerHTML = personalAssistantCSS;
  document.head.appendChild(assistantStyleSheet);
}

export default PersonalAssistantPage;
