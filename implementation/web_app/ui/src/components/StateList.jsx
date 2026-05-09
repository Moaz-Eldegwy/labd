import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './StateList.css';

const StateList = ({ steps, currentStatus, currentThought, onItemClick }) => {
    // steps: Array of { type: 'think'|'code'|'exec'|'error'|'success', content: string, duration: number }

    return (
        <div className="state-list">
            {steps.map((step, idx) => (
                <div
                    key={idx}
                    className={`state-item ${step.type} ${['code', 'exec', 'success', 'error'].includes(step.type) ? 'interactive' : ''}`}
                    onClick={() => ['code', 'exec', 'success', 'error'].includes(step.type) && onItemClick && onItemClick(step.type)}
                >
                    <div className="state-icon">
                        {step.type === 'think' && '💭'}
                        {step.type === 'code' && '📝'}
                        {step.type === 'exec' && '⚙️'}
                        {step.type === 'success' && '✅'}
                        {step.type === 'error' && '❌'}
                        {step.type === 'answer' && '📝'}
                    </div>
                    <div className="state-details">
                        <div className="state-title">
                            {step.type === 'think' && 'Thinking Process'}
                            {step.type === 'code' && 'Generated Code'}
                            {step.type === 'exec' && 'Executing...'}
                            {step.type === 'success' && 'Execution Verified'}
                            {step.type === 'error' && 'Execution Failed'}
                            {step.type === 'answer' && 'Answer Finalized'}
                            {step.duration && step.duration !== 'Final' && <span className="duration">{step.duration}s</span>}
                        </div>
                        {step.content && (
                            <div className="state-body">
                                {step.type === 'think' ? (
                                    <details onClick={(e) => e.stopPropagation()}>
                                        <summary>View Thoughts</summary>
                                        <div className="thought-text">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {step.content}
                                            </ReactMarkdown>
                                        </div>
                                    </details>
                                ) : (
                                    step.type !== 'code' && <div>{step.content}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Active Current State */}
            {currentStatus !== 'idle' && currentStatus !== 'success' && currentStatus !== 'failure' && (
                <div
                    className={`state-item active-pulse ${['writing_code', 'executing', 'debugging'].includes(currentStatus) ? 'interactive' : ''}`}
                    onClick={() => ['writing_code', 'executing', 'debugging'].includes(currentStatus) && onItemClick && onItemClick(currentStatus)}
                >
                    <div className="state-icon">
                        {currentStatus === 'thinking' && '🤔'}
                        {currentStatus === 'writing_code' && '✍️'}
                        {currentStatus === 'executing' && '⚙️'}
                        {currentStatus === 'debugging' && '🔧'}
                        {currentStatus === 'answering' && '📝'}
                    </div>
                    <div className="state-details">
                        <div className="state-title">
                            {currentStatus === 'thinking' && 'Thinking...'}
                            {currentStatus === 'writing_code' && 'Writing Code...'}
                            {currentStatus === 'executing' && 'Running Code...'}
                            {currentStatus === 'debugging' && 'Debugging...'}
                            {currentStatus === 'answering' && 'Finalizing Answer...'}
                        </div>
                        {currentStatus === 'thinking' && currentThought && (
                            <div className="thought-preview">{currentThought.slice(-100)}...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StateList;
