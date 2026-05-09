import React from 'react';
import './EnvironmentFeedback.css';

const EnvironmentFeedback = ({ output, success }) => {
    if (!output) return null;

    // Extract content inside <feedback> tags
    const feedbackMatch = output.match(/<feedback>([\s\S]*?)<\/feedback>/);
    const cleanOutput = feedbackMatch ? feedbackMatch[1].trim() : output;

    return (
        <div className="terminal-body">
            <div className="terminal-line command-line">
                <span className="prompt-user">agent</span>
                <span className="prompt-sep">&gt;</span>
                <span className="command-text">execution_code.py</span>
            </div>
            <pre className="env-output">{cleanOutput}</pre>
        </div>
    );
};

export default EnvironmentFeedback;
