import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import StateList from './StateList';
import { useAgent, AGENT_STATE } from '../hooks/useAgent';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './ChatArea.css';

const ChatArea = ({ messages, agentState, agentProfile, userProfile, onSendMessage, onCodeActivity, onStateClick, isRightSidebarOpen, theme }) => {
    // const { messages, agentState, sendMessage } = useAgent(); // Removed internal hook
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, agentState.steps, agentState.status]);

    // Sync Right Sidebar Visibility
    useEffect(() => {
        if (agentState.status === AGENT_STATE.WRITING_CODE ||
            agentState.status === AGENT_STATE.EXECUTING ||
            agentState.code) {
            onCodeActivity(true);
        }
    }, [agentState.status, agentState.code, onCodeActivity]);

    const isWorking = agentState.status !== AGENT_STATE.IDLE;

    // Helper to render avatar based on profile
    const renderAgentAvatar = () => {
        if (agentProfile?.type === 'image' && agentProfile?.avatar) {
            return <img src={agentProfile.avatar} alt="Agent" className="agent-avatar-img" />;
        }
        return <div className="agent-avatar-emoji">{agentProfile?.avatar || '🤖'}</div>;
    };

    // Unified Markdown configuration
    const markdownComponents = {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isDark = theme === 'dark';

            if (!inline && match) {
                return (
                    <div className="code-block-wrapper">
                        <div className="code-block-header">
                            <span className="code-lang-label">{language}</span>
                        </div>
                        <SyntaxHighlighter
                            style={isDark ? vscDarkPlus : vs}
                            language={language}
                            PreTag="div"
                            customStyle={{ margin: 0, borderRadius: '0 0 6px 6px', fontSize: '0.9rem' }}
                            {...props}
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    </div>
                );
            }
            return <code className={className} {...props}>{children}</code>;
        }
    };

    return (
        <div className={`chat-area ${isRightSidebarOpen ? 'shrunk' : ''}`}>
            <div className="messages-list">
                {messages.length === 0 && !isWorking && (
                    <div className="empty-state">
                        <p className="empty-label">Suggested Start</p>
                        <div className="suggestions-grid">
                            {[
                                {
                                    title: "Python Problem: Largest Positive",
                                    desc: "Write a function to find the largest positive number...",
                                    prompt: `Problem: Write a python function to find the largest positive number from the given list.
  
Test Cases:
assert largest_pos([1,2,3,4,-1]) == 4
assert largest_pos([0,1,2,-5,-1,6]) == 6
assert largest_pos([0,0,1,0]) == 1`
                                },
                                {
                                    title: "Python Problem: Check Scalene",
                                    desc: "Write a function to print check if the triangle is scalene...",
                                    prompt: `Problem: Write a function to print check if the triangle is scalene or not.

Test Cases:

assert check_isosceles(6,8,12)==True
assert check_isosceles(6,6,12)==False
assert check_isosceles(6,15,20)==True`
                                },
                                {
                                    title: "Python Problem: Square Root",
                                    desc: "Write a function to find the square root of a perfect number...",
                                    prompt: `Problem: Write a function to find the square root of a perfect number.

Test Cases

assert sqrt_root(4)==2
assert sqrt_root(16)==4
assert sqrt_root(400)==20`
                                },
                                {
                                    title: "Python Problem: Min Length",
                                    desc: "Write a function to find the list of lists with minimum length...",
                                    prompt: `Problem: Write a function to find the list of lists with minimum length.

Test Cases:

assert min_length([[0], [1, 3], [5, 7], [9, 11], [13, 15, 17]])==(1, [0])
assert min_length([[1], [5, 7], [10, 12, 14,15]])==(1, [1])
assert min_length([[5], [15,20,25]])==(1, [5])`
                                }
                            ].map((item, idx) => (
                                <button
                                    key={idx}
                                    className="suggested-card"
                                    onClick={() => onSendMessage(item.prompt)}
                                >
                                    <div className="mini-title">{item.title}</div>
                                    <div className="mini-desc">{item.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.filter(m => userProfile?.settings?.debugMode || (!m.content.includes('<feedback>') && !m.isIntermediate)).map((msg, i) => (
                    <div key={i} className={`message ${msg.role}`}>
                        {msg.role === 'assistant' && (
                            <div className="avatar">
                                {renderAgentAvatar()}
                            </div>
                        )}

                        <div className="message-bubble">
                            <div className="message-role">{msg.role === 'user' ? 'You' : (agentProfile?.name || 'Agent')}</div>

                            {/* Debug: Show Raw Input */}
                            {userProfile?.settings?.debugMode && userProfile?.settings?.showRawInput && msg.role === 'user' && msg.rawInput && (
                                <div className="debug-raw-input">
                                    <small>Raw Input:</small>
                                    <pre>{JSON.stringify(msg.rawInput, null, 2)}</pre>
                                </div>
                            )}

                            {/* If message has historical steps (completed turn) */}
                            {msg.steps && msg.steps.length > 0 && (
                                <StateList
                                    steps={msg.steps}
                                    currentStatus="idle"
                                    onItemClick={onStateClick}
                                />
                            )}

                            <div className="message-content">
                                {userProfile?.settings?.debugMode && msg.role === 'assistant' ? (
                                    <pre className="debug-output">{msg.content || '...'}</pre>
                                ) : (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={markdownComponents}
                                    >
                                        {msg.content || '...'}
                                    </ReactMarkdown>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Active Working State (Pending Message) */}
                {isWorking && (
                    <div className="message assistant">
                        <div className="avatar">
                            {renderAgentAvatar()}
                        </div>
                        <div className="message-bubble">
                            <div className="message-role">{agentProfile?.name || 'Agent'}</div>

                            {/* Live Steps + Active Status */}
                            {userProfile?.settings?.debugMode ? (
                                <div className="message-content">
                                    <pre className="debug-output">{agentState.thought || '...'}</pre>
                                </div>
                            ) : (
                                <>
                                    <StateList
                                        steps={agentState.steps}
                                        currentStatus={agentState.status}
                                        currentThought={agentState.thought}
                                        onItemClick={onStateClick}
                                    />
                                    {/* Live Answer Streaming */}
                                    {agentState.currentAnswer && (
                                        <div className="streaming-answer message-content">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                {agentState.currentAnswer}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default ChatArea;
