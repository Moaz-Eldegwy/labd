import React, { useState, useEffect } from 'react';
import './UserProfileModal.css';

const UserProfileModal = ({ isOpen, onClose, currentUser, currentAgent, onSave, onSaveAgent }) => {
    const [activeTab, setActiveTab] = useState('user'); // 'user' | 'agent' | 'settings'

    // User State
    const [name, setName] = useState(currentUser?.name || '');
    const [avatar, setAvatar] = useState(currentUser?.avatar || null);
    const [preview, setPreview] = useState(currentUser?.avatar || null);


    // Settings State
    const [debugMode, setDebugMode] = useState(currentUser?.settings?.debugMode || false);
    const [showRawInput, setShowRawInput] = useState(currentUser?.settings?.showRawInput || false);

    // Agent State
    const [agentName, setAgentName] = useState(currentAgent?.name || 'Agent');
    const [agentAvatar, setAgentAvatar] = useState(currentAgent?.avatar || '🤖');
    const [agentType, setAgentType] = useState(currentAgent?.type || 'emoji'); // 'emoji' | 'image'

    // Preset Emojis
    const emojiPresets = ['🤖', '🧠', '⚡', '🦉', '✨', '🛡️', '🧙‍♂️', '🚀', '🔮', '🧿'];

    useEffect(() => {
        if (isOpen) {
            // User
            setName(currentUser?.name || '');
            setAvatar(currentUser?.avatar || null);

            setDebugMode(currentUser?.settings?.debugMode || false);
            setShowRawInput(currentUser?.settings?.showRawInput || false);

            // Agent
            setAgentName(currentAgent?.name || 'Agent');
            setAgentAvatar(currentAgent?.avatar || '🤖');
            setAgentType(currentAgent?.type || 'emoji');
            setActiveTab('user'); // Reset to user tab on open
        }
    }, [isOpen, currentUser, currentAgent]);


    const handleImageChange = (e, isAgent = false) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = (readerEvent) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 300;

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality to ensure small size for localStorage
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

                    if (isAgent) {
                        setAgentAvatar(compressedDataUrl);
                        setAgentType('image');
                    } else {
                        setAvatar(compressedDataUrl);
                        setPreview(compressedDataUrl);
                    }
                };
                img.src = readerEvent.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = (isAgent = false) => {
        if (isAgent) {
            setAgentAvatar('🤖');
            setAgentType('emoji');
        } else {
            setAvatar(null);
            setPreview(null);
        }
    };

    const handleSave = () => {
        if (activeTab === 'user' || activeTab === 'settings') {
            onSave({
                name,
                avatar,
                settings: {
                    debugMode,
                    showRawInput
                }
            });
        } else {
            onSaveAgent({ name: agentName, avatar: agentAvatar, type: agentType });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'user' ? 'active' : ''}`}
                        onClick={() => setActiveTab('user')}
                    >
                        User Profile
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'agent' ? 'active' : ''}`}
                        onClick={() => setActiveTab('agent')}
                    >
                        Agent Appearance
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Settings
                    </button>
                </div>

                <div className="modal-body">
                    {activeTab === 'user' ? (
                        <>
                            <div className="avatar-section">
                                <div className="avatar-preview">
                                    {preview ? (
                                        <img src={preview} alt="Profile Preview" />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {name ? name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="button-group-avatar">
                                    <label className="upload-btn">
                                        Change Photo
                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, false)} hidden />
                                    </label>
                                    {preview && (
                                        <button className="remove-btn" onClick={() => handleRemovePhoto(false)}>
                                            Remove Photo
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Your Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                />
                            </div>
                        </>
                    ) : activeTab === 'agent' ? (
                        <>
                            <div className="avatar-section">
                                <div className="avatar-preview">
                                    {agentType === 'image' ? (
                                        <img src={agentAvatar} alt="Agent Preview" />
                                    ) : (
                                        <div className="avatar-placeholder emoji">{agentAvatar}</div>
                                    )}
                                </div>

                                <div className="emoji-grid">
                                    {emojiPresets.map(emoji => (
                                        <button
                                            key={emoji}
                                            className={`emoji-btn ${agentAvatar === emoji ? 'selected' : ''}`}
                                            onClick={() => {
                                                setAgentAvatar(emoji);
                                                setAgentType('emoji');
                                            }}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>

                                <div className="button-group-avatar">
                                    <label className="upload-btn">
                                        Upload Image
                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, true)} hidden />
                                    </label>
                                    {agentType === 'image' && (
                                        <button className="remove-btn" onClick={() => handleRemovePhoto(true)}>
                                            Reset to Emoji
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Agent Name</label>
                                <input
                                    type="text"
                                    value={agentName}
                                    onChange={(e) => setAgentName(e.target.value)}
                                    placeholder="Name your agent"
                                />
                            </div>
                        </>
                    ) : (
                        <div className="settings-section">
                            <div className="setting-item">
                                <div className="setting-info">
                                    <label>Debug Mode</label>
                                    <p>Disable state processor and show raw model output.</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={debugMode}
                                        onChange={(e) => {
                                            setDebugMode(e.target.checked);
                                            if (!e.target.checked) setShowRawInput(false);
                                        }}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            {debugMode && (
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <label>Show Raw LLM Input</label>
                                        <p>Display the prompt JSON sent to the model.</p>
                                    </div>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={showRawInput}
                                            onChange={(e) => setShowRawInput(e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-save" onClick={handleSave}>
                        Save {activeTab === 'agent' ? 'Agent' : 'Changes'}
                    </button>
                </div>
            </div>
        </div >
    );
};

export default UserProfileModal;
