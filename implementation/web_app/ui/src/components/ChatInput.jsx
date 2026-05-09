import React, { useRef, useEffect } from 'react';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, onStopGeneration, isWorking }) => {
    const inputRef = useRef(null);

    const handleSend = () => {
        const text = inputRef.current ? inputRef.current.value.trim() : '';
        if (text) {
            onSendMessage(text);
            if (inputRef.current) inputRef.current.value = '';
            inputRef.current.style.height = 'auto'; // Reset height
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const adjustHeight = (el) => {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, window.innerHeight * 0.5) + 'px';
    };

    const handleInput = (e) => {
        adjustHeight(e.target);
    };

    return (
        <div className="chat-input-container">
            <div className="input-box">
                <textarea
                    ref={inputRef}
                    placeholder="Describe your task..."
                    disabled={isWorking}
                    onKeyDown={handleKeyDown}
                    onInput={handleInput}
                    rows={1}
                />
                <button onClick={isWorking ? onStopGeneration : handleSend} className="send-btn" aria-label={isWorking ? "Stop" : "Send"}>
                    {isWorking ? (
                        /* Stop Icon */
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <rect x="6" y="6" width="12" height="12" rx="1" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
