import React, { useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './CodeEditor.css';

const CodeEditor = ({ code, status }) => {
    // We can auto-scroll if needed, but SyntaxHighlighter handles a lot.
    // If we want auto-scroll to bottom during streaming, we might need a wrapper ref.
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [code]);

    return (
        <div className={`code-editor-container glass-panel ${status === 'writing_code' ? 'active-write' : ''}`}>

            <div className="editor-content" ref={scrollRef}>
                <SyntaxHighlighter
                    language="python"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, height: '100%', background: 'transparent' }}
                    showLineNumbers={true}
                    wrapLines={true}
                >
                    {code || ''}
                </SyntaxHighlighter>
                {status === 'writing_code' && <span className="cursor-blink">|</span>}
            </div>
        </div>
    );
};

export default CodeEditor;
