import React, { useState, useEffect } from 'react';
import './StateProcessor.css';

const StateProcessor = ({ status, thoughtContent, iteration }) => {
  const [expanded, setExpanded] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (status === 'thinking' || status === 'debugging') {
      interval = setInterval(() => {
        setTimer(t => t + 100); // ms
      }, 100);
    } else {
      // Don't reset timer immediately to show "Thought for X s"
    }
    return () => clearInterval(interval);
  }, [status]);

  // Reset timer on new phase start if needed?
  // The logic implies we show "Thought for Xs". So we capture the time when it finishes.

  const getLabel = () => {
    switch (status) {
      case 'thinking': return `Thinking... (${(timer/1000).toFixed(1)}s)`;
      case 'thought_complete': return `Thought for ${(timer/1000).toFixed(1)}s`;
      case 'writing_code': return `Writing Code... (Iteration ${iteration})`;
      case 'executing': return `Executing Code...`;
      case 'success': return `Execution Success`;
      case 'failure': return `Execution Failed`;
      case 'debugging': return `Debugging... (Iteration ${iteration})`;
      default: return 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'thinking': return 'text-blue-400';
      case 'debugging': return 'text-orange-400';
      case 'success': return 'text-green-400';
      case 'failure': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="state-processor glass-panel">
      <div 
        className={`status-header ${getStatusColor()}`} 
        onClick={() => setExpanded(!expanded)}
      >
        <span className="status-dot"></span>
        <span className="status-text">{getLabel()}</span>
        {thoughtContent && <span className="toggle-icon">{expanded ? '▼' : '▶'}</span>}
      </div>
      
      {expanded && thoughtContent && (
        <div className="thought-content">
          {thoughtContent}
        </div>
      )}
    </div>
  );
};

export default StateProcessor;
