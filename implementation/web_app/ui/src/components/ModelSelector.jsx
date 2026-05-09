import React, { useState, useEffect, useRef } from 'react';
import './ModelSelector.css';

const ModelSelector = ({ selectedModel, onSelect }) => {
    const [models, setModels] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null); 
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                // 1. Fetch Ollama Models
                let ollamaModels = [];
                try {
                    const response = await fetch('http://localhost:11434/api/tags');
                    if (response.ok) {
                        const data = await response.json();
                        ollamaModels = (data.models || []).map(m => ({
                            name: m.name,
                            details: m.details,
                            provider: 'ollama'
                        }));
                    }
                } catch (err) {
                    console.warn("Failed to fetch Ollama models", err);
                }

                // 2. Add Llama.cpp Option (Dynamic Fetch)
                let llamaCppModel = {
                    name: "Local Llama.cpp", // Fallback Default
                    details: { parameter_size: "Local" },
                    provider: 'llamacpp',
                    disabled: false
                };

                try {
                    // Try to fetch specific model info from standard Llama.cpp server endpoints
                    // /v1/models is standard for the server example
                    const response = await fetch('http://localhost:8000/v1/models');
                    if (response.ok) {
                        const data = await response.json();
                        // data.data is an array of models
                        if (data.data && data.data.length > 0) {
                            // Usually returns full path, e.g. "models/my-model.gguf"
                            const fullPath = data.data[0].id;
                            const fileName = fullPath.split('/').pop().split('\\').pop(); // Simple basename

                            llamaCppModel = {
                                name: fileName,
                                details: { parameter_size: "Local" },
                                provider: 'llamacpp',
                                disabled: false
                            };
                        }
                    }
                } catch (err) {
                    // Fallback to generic name if fetch fails (e.g. server not running yet)
                    // We keep it enabled so user can select it even if server starts later
                    console.warn("Llama.cpp fetch failed, using fallback name");
                }

                const allModels = [...ollamaModels, llamaCppModel];
                setModels(allModels);
                setLoading(false);

                // If the selected model is Llama.cpp (by provider), and we found a new name, 
                // we technically don't need to force update here because we handle display below.

            } catch (err) {
                console.error("Error setting up models:", err);
                setLoading(false);
            }
        };

        fetchModels();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (model) => {
        if (model.disabled) return;
        onSelect(model);
        setIsOpen(false);
    };

    // Helper to get display name safely
    const getDisplayName = (modelVal) => {
        if (!modelVal) return "Select Model";
        return typeof modelVal === 'object' ? modelVal.name : modelVal;
    };

    const currentName = getDisplayName(selectedModel);

    // Robust Display Logic:
    // If selectedModel is our generic Llama placeholder (from App init), 
    // but we found a REAL Llama model in our list, show the REAL name.
    const displayModel = models.find(m =>
        (typeof selectedModel === 'object' && m.provider === selectedModel.provider && m.provider === 'llamacpp') ||
        m.name === currentName
    ) || (typeof selectedModel === 'object' ? selectedModel : { name: currentName });


    return (
        <div className="model-selector-container" ref={dropdownRef}>
            <div
                className={`model-selector-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {displayModel.name} <span className="caret">▼</span>
            </div>

            {isOpen && (
                <div className="model-dropdown">
                    {loading && <div className="dropdown-item disabled">Loading...</div>}
                    {!loading && models.length === 0 && (
                        <div className="dropdown-item disabled">No models found</div>
                    )}
                    {models.map((model) => (
                        <div
                            key={`${model.provider}-${model.name}`}
                            className={`dropdown-item ${displayModel.name === model.name ? 'selected' : ''} ${model.disabled ? 'disabled' : ''}`}
                            onClick={() => handleSelect(model)}
                        >
                            <div className="model-info-col">
                                <span className="model-name">{model.name}</span>
                                {model.details && <span className="model-size">{model.details.parameter_size}</span>}
                            </div>
                            <span className={`model-provider-badge ${model.provider}`}>
                                {model.provider === 'llamacpp' ? 'llama' : 'Ollama'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ModelSelector;
