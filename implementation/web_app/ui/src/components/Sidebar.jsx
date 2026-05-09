import React from 'react';
import './Sidebar.css';

const Sidebar = ({
    isOpen,
    toggle,
    activeId,
    toggleTheme,
    currentTheme,
    folders = [],
    chats = [],
    onNewChat,
    onLoadChat,
    onCreateFolder,
    onDeleteChat,
    onMoveChat,
    onRenameFolder,
    onDeleteFolder,
    userProfile,
    onEditProfile
}) => {
    const [expandedFolders, setExpandedFolders] = React.useState({});
    const [menuOpenId, setMenuOpenId] = React.useState(null);
    const [folderMenuOpenId, setFolderMenuOpenId] = React.useState(null);

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const handleAddFolder = () => {
        const name = prompt("Enter folder name:");
        if (name) onCreateFolder(name);
    };

    const handleMenuClick = (e, chatId) => {
        e.stopPropagation();
        setMenuOpenId(menuOpenId === chatId ? null : chatId);
        setFolderMenuOpenId(null); // Close folder menu if chat menu opens
    };

    const handleFolderMenuClick = (e, folderId) => {
        e.stopPropagation();
        setFolderMenuOpenId(folderMenuOpenId === folderId ? null : folderId);
        setMenuOpenId(null); // Close chat menu if folder menu opens
    };

    const handleRenameFolderClick = (folder) => {
        const newName = prompt("Enter new folder name:", folder.name);
        if (newName && newName !== folder.name) {
            onRenameFolder(folder.id, newName);
        }
        setFolderMenuOpenId(null);
    };

    // Close menu when clicking outside (simple version)
    React.useEffect(() => {
        const closeMenu = () => {
            setMenuOpenId(null);
            setFolderMenuOpenId(null);
        };
        document.addEventListener('click', closeMenu);
        return () => document.removeEventListener('click', closeMenu);
    }, []);

    const groupedChats = React.useMemo(() => {
        const inFolders = {};
        const unorganized = [];

        folders.forEach(f => inFolders[f.id] = []);

        chats.forEach(chat => {
            if (chat.folderId && inFolders[chat.folderId]) {
                inFolders[chat.folderId].push(chat);
            } else {
                unorganized.push(chat);
            }
        });

        // Sort by date desc
        unorganized.sort((a, b) => new Date(b.date) - new Date(a.date));
        Object.values(inFolders).forEach(list => list.sort((a, b) => new Date(b.date) - new Date(a.date)));

        return { inFolders, unorganized };
    }, [folders, chats]);

    const renderChatList = (chatList) => {
        return chatList.map(chat => (
            <div
                key={chat.id}
                className={`session-item ${activeId === chat.id ? 'active' : ''}`}
                onClick={() => onLoadChat(chat.id)}
            >
                <span>{chat.title}</span>
                <button className="more-btn" onClick={(e) => handleMenuClick(e, chat.id)}>•••</button>

                {menuOpenId === chat.id && (
                    <div className="ctx-menu" onClick={e => e.stopPropagation()}>
                        <div onClick={(e) => onDeleteChat(e, chat.id)}>Delete</div>
                        {folders.length > 0 && <div className="menu-divider"></div>}
                        {folders.map(f => (
                            <div key={f.id} onClick={() => { onMoveChat(chat.id, f.id); setMenuOpenId(null); }}>
                                Move to {f.name}
                            </div>
                        ))}
                        <div onClick={() => { onMoveChat(chat.id, null); setMenuOpenId(null); }}>
                            Remove from Folder
                        </div>
                    </div>
                )}
            </div>
        ));
    };

    return (
        <>
            <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <span className="brand-title">SCA UI</span>
                    <button className="icon-btn toggle-btn" onClick={toggle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                    </button>
                </div>

                <div className="sidebar-content">
                    <button className="action-item" onClick={onNewChat}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        <span>New Chat</span>
                    </button>
                    {/* Search - Placeholder functionality for now */}
                    <button className="action-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <span>Search</span>
                    </button>

                    {/* Folders Section */}
                    <div className="sidebar-section">
                        <div className="section-header">
                            <span>Folders</span>
                            <button className="icon-btn-small" onClick={handleAddFolder}>+</button>
                        </div>
                        <div className="folders-list">
                            {folders.map(folder => (
                                <div key={folder.id} className="folder-container">
                                    <div className="folder-header" onClick={() => toggleFolder(folder.id)}>
                                        <div className="folder-title">
                                            <span className="folder-icon">{expandedFolders[folder.id] ? '📂' : '📁'}</span>
                                            <span>{folder.name}</span>
                                        </div>
                                        <button className="more-btn" onClick={(e) => handleFolderMenuClick(e, folder.id)}>•••</button>

                                        {folderMenuOpenId === folder.id && (
                                            <div className="ctx-menu" onClick={e => e.stopPropagation()}>
                                                <div onClick={() => handleRenameFolderClick(folder)}>Rename</div>
                                                <div onClick={() => { onDeleteFolder(folder.id); setFolderMenuOpenId(null); }}>Delete</div>
                                            </div>
                                        )}
                                    </div>
                                    {expandedFolders[folder.id] && (
                                        <div className="folder-items">
                                            {renderChatList(groupedChats.inFolders[folder.id] || [])}
                                            {(groupedChats.inFolders[folder.id] || []).length === 0 && (
                                                <div className="empty-folder">Empty</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Unorganized Chats */}
                    <div className="sidebar-section">
                        <div className="section-header">
                            <span>History</span>
                        </div>
                        {groupedChats.unorganized.length === 0 && (
                            <div className="empty-history">No history</div>
                        )}
                        {renderChatList(groupedChats.unorganized)}
                    </div>

                    <div className="sidebar-footer">
                        <div className="user-profile" onClick={onEditProfile}>
                            <div className="avatar-circle">
                                {userProfile?.avatar ? (
                                    <img src={userProfile.avatar} alt="User" />
                                ) : (
                                    (userProfile?.name?.charAt(0) || '?').toUpperCase()
                                )}
                            </div>
                            <span>{userProfile?.name || 'User'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
