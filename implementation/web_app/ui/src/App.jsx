import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import RightSidebar from './components/RightSidebar';
import ChatInput from './components/ChatInput';
import ModelSelector from './components/ModelSelector';
import UserProfileModal from './components/UserProfileModal';
import './App.css';

import { useAgent, AGENT_STATE } from './hooks/useAgent';

function App() {
  const [activeSession, setActiveSession] = useState('current');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false); // Default closed, opens on code interaction
  const [currentModel, setCurrentModel] = useState({ name: 'Local Llama.cpp', provider: 'llamacpp' });

  // User Profile State (Lifted higher to pass settings to agent)
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('sca_user_profile');
    return saved ? JSON.parse(saved) : { name: 'Moaz', avatar: null, settings: { debugMode: false, showRawInput: false } };
  });

  // Lifted Agent State
  const { messages, agentState, sendMessage, stopGeneration, loadSession, clearSession } = useAgent(userProfile?.settings?.debugMode);
  const isWorking = agentState.status !== AGENT_STATE.IDLE;

  // --- Sidebar & Session Management ---
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem('sca_folders');
    return saved ? JSON.parse(saved) : [];
  });
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('sca_chatHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Current Session ID (null = new unsaved session)
  // Re-using activeSession state, but ensuring it matches ID.
  // const [activeSession, setActiveSession] = useState('current'); // 'current' or ID

  // Auto-save effects
  React.useEffect(() => {
    localStorage.setItem('sca_folders', JSON.stringify(folders));
  }, [folders]);

  React.useEffect(() => {
    localStorage.setItem('sca_chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Helper to save current session before switching
  const saveCurrentSession = () => {
    if (messages.length === 0) return;

    if (activeSession && activeSession !== 'current') {
      // Update existing
      setChatHistory(prev => prev.map(c =>
        c.id === activeSession
          ? { ...c, messages: messages, date: new Date().toISOString() }
          : c
      ));
    } else {
      // Create new
      const newId = Date.now().toString();
      // Generate title from first user message if possible
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg ? firstUserMsg.content.slice(0, 30) + '...' : 'New Chat';

      const newHistoryItem = {
        id: newId,
        title: title,
        date: new Date().toISOString(),
        messages: messages,
        folderId: null
      };
      setChatHistory(prev => [newHistoryItem, ...prev]);
      setActiveSession(newId); // Switch to this ID context
    }
  };

  const handleNewChat = () => {
    saveCurrentSession();
    clearSession();
    setActiveSession('current');
  };

  const handleLoadChat = (chatId) => {
    saveCurrentSession(); // Save whatever we were doing

    const session = chatHistory.find(c => c.id === chatId);
    if (session) {
      loadSession(session.messages);
      setActiveSession(chatId);
    }
  };

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(c => c.id !== chatId));
    if (activeSession === chatId) {
      handleNewChat();
    }
  };

  const handleCreateFolder = (name) => {
    const newFolder = {
      id: Date.now().toString(),
      name
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const handleMoveChatToFolder = (chatId, folderId) => {
    setChatHistory(prev => prev.map(c =>
      c.id === chatId ? { ...c, folderId } : c
    ));
  };

  const handleRenameFolder = (folderId, newName) => {
    setFolders(prev => prev.map(f =>
      f.id === folderId ? { ...f, name: newName } : f
    ));
  };

  const handleDeleteFolder = (folderId) => {
    // 1. Remove the folder
    setFolders(prev => prev.filter(f => f.id !== folderId));

    // 2. Move chats in that folder to "unorganized" (null folderId)
    setChatHistory(prev => prev.map(c =>
      c.folderId === folderId ? { ...c, folderId: null } : c
    ));
  };

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sca_theme') || 'dark';
  }); // Default from storage or Dark

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sca_theme', theme);
  }, [theme]);

  // Auto-open Right Sidebar when agent starts writing code
  React.useEffect(() => {
    if (agentState.status === AGENT_STATE.WRITING_CODE ||
      agentState.status === AGENT_STATE.EXECUTING ||
      agentState.status === AGENT_STATE.DEBUGGING ||
      agentState.status === AGENT_STATE.SUCCESS ||
      agentState.status === AGENT_STATE.FAILURE) {
      if (!rightOpen) setRightOpen(true);
    }
  }, [agentState.status]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Callback to auto-open right sidebar when code needs to be shown
  const handleShowCode = (show) => {
    if (show && !rightOpen) setRightOpen(true);
  };

  // Toggle Right Sidebar on State Click
  const handleStateClick = (type) => {
    // If it's code/exec related, we toggle/open the sidebar
    if (['code', 'exec', 'success', 'error', 'writing_code', 'executing', 'debugging'].includes(type) || type === 'code_toggle') {
      if (!rightOpen) setRightOpen(true);
    }
  };

  // User Profile State (Moved up)
  // const [userProfile, setUserProfile] = useState(...) // Already declared above

  // Agent Profile State
  const [agentProfile, setAgentProfile] = useState(() => {
    const saved = localStorage.getItem('sca_agent_profile');
    return saved ? JSON.parse(saved) : { name: 'Agent', avatar: '🤖', type: 'emoji' };
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSaveProfile = (newProfile) => {
    setUserProfile(newProfile);
    try {
      localStorage.setItem('sca_user_profile', JSON.stringify(newProfile));
    } catch (error) {
      console.error("Failed to save profile to localStorage:", error);
      alert("Failed to save changes. The image might be too large.");
    }
  };

  const handleSaveAgent = (newAgentProfile) => {
    setAgentProfile(newAgentProfile);
    try {
      localStorage.setItem('sca_agent_profile', JSON.stringify(newAgentProfile));
    } catch (error) {
      console.error("Failed to save agent profile:", error);
      alert("Failed to save agent changes. Image might be too large.");
    }
  };

  return (
    <div className="app-container">
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={userProfile}
        currentAgent={agentProfile}
        onSave={handleSaveProfile}
        onSaveAgent={handleSaveAgent}
      />
      <Sidebar
        isOpen={leftOpen}
        toggle={() => setLeftOpen(!leftOpen)}
        activeId={activeSession}
        toggleTheme={toggleTheme}
        currentTheme={theme}
        folders={folders}
        chats={chatHistory}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        onCreateFolder={handleCreateFolder}
        onDeleteChat={handleDeleteChat}
        onMoveChat={handleMoveChatToFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        userProfile={userProfile}
        onEditProfile={() => setIsProfileOpen(true)}
      />

      <div className="main-content">
        {/* Header (Optional, could be componentized) */}
        <div className="top-header">
          <ModelSelector selectedModel={currentModel} onSelect={setCurrentModel} />
          <div className="header-actions">
            <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? (
                // Sun Icon for Dark Mode (switch to Light)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                // Moon Icon for Light Mode (switch to Dark)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            <div className="header-profile" onClick={() => setIsProfileOpen(true)}>
              <div className="avatar-circle-small">
                {userProfile?.avatar ? (
                  <img src={userProfile.avatar} alt="User" />
                ) : (
                  (userProfile?.name?.charAt(0) || '?').toUpperCase()
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="content-row">
          <ChatArea
            messages={messages}
            agentState={agentState}

            agentProfile={agentProfile}
            userProfile={userProfile}
            onSendMessage={(text) => sendMessage(text, currentModel)}

            onCodeActivity={handleShowCode}
            onStateClick={handleStateClick}
            isRightSidebarOpen={rightOpen}
            theme={theme}
          />

          <RightSidebar
            isOpen={rightOpen}
            toggle={() => setRightOpen(!rightOpen)}
            code={agentState.code}
            executionOutput={agentState.output}
            execSuccess={agentState.execSuccess}
            status={agentState.status}
          />
        </div>

        <ChatInput
          onSendMessage={(text) => sendMessage(text, currentModel)}
          onStopGeneration={stopGeneration}
          isWorking={isWorking}
        />
      </div>
    </div>
  )
}

export default App;
