import React from 'react';
import CodeEditor from './CodeEditor';
import EnvironmentFeedback from './EnvironmentFeedback';
import './RightSidebar.css';

const RightSidebar = ({ isOpen, toggle, code, executionOutput, execSuccess, status }) => {
    if (!isOpen) {
        // We don't render content but we might want a small toggle handle
        // Actually App.jsx handles visibility via CSS grid/flex usually, 
        // but here we are doing a collapsible panel.
        return null;
    }

    return (
        <div className="right-sidebar">
            {/* Code Editor Section - Visible when writing code or has code */}
            {(code || ['writing_code', 'executing', 'success', 'failure', 'debugging'].includes(status)) && (
                <div className="panel-section code-section">
                    <div className="panel-header">
                        <span>Code Editor</span>
                        <span className="lang-badge">Python</span>
                    </div>
                    <div className="panel-content no-padding">
                        <CodeEditor code={code} status={status} />
                    </div>
                </div>
            )}

            {/* Terminal Section - Visible when executing or has output */}
            {(executionOutput || ['executing', 'success', 'failure', 'debugging'].includes(status)) && (
                <div className="panel-section terminal-section">
                    <div className="panel-header">
                        <span>Terminal</span>
                        {/* Show badge if execution has finished (assumed if we have output or success is boolean) */}
                        {execSuccess === true && <span className="status-badge success">Success</span>}
                        {execSuccess === false && <span className="status-badge error">Fail</span>}
                    </div>
                    <div className="panel-content terminal-content">
                        {executionOutput ? (
                            <EnvironmentFeedback output={executionOutput} success={execSuccess} />
                        ) : (
                            <div className="empty-terminal">Ready to execute...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RightSidebar;
