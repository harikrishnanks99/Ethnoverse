import React, { useState, useEffect, useRef } from 'react';
import api, { executeChat } from '../api/axios';
import { Send, Bot, User, Link as LinkIcon, FileText, Image as ImageIcon, Video, Music } from 'lucide-react';
import './Search.css'; // Let's add specific styles or reuse existing

const Search = () => {
    const [query, setQuery] = useState('');
    const [communityId, setCommunityId] = useState('All');
    const [communities, setCommunities] = useState([]);
    const [chatHistory, setChatHistory] = useState([]); // [{ role: 'user'|'ai', content: '...', sources: [...] }]
    const [loading, setLoading] = useState(false);
    const [expandedSources, setExpandedSources] = useState({}); // Track expanded source cards
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, loading]);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await api.get('/communities/my-communities');
                setCommunities(response.data);
            } catch (err) {
                console.error("Failed to load communities config", err);
            }
        };
        fetchCommunities();
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = { role: 'user', content: query };
        const newHistory = [...chatHistory, userMsg];
        setChatHistory(newHistory);
        setQuery('');
        setLoading(true);

        // Format history for API (exclude sources)
        const apiHistory = chatHistory.map(m => ({ role: m.role, content: m.content }));

        try {
            // Hit the new node-edge AI agent route
            const data = await executeChat(
                userMsg.content,
                apiHistory,
                communityId === 'All' ? null : communityId,
                5
            );

            // Expected response: { answer: '...', sources: [...] }
            setChatHistory([...newHistory, { role: 'ai', content: data.answer, sources: data.sources || [] }]);
        } catch (err) {
            console.error("Chat error:", err);
            setChatHistory([...newHistory, { role: 'ai', content: `Error: ${err.response?.data?.detail || 'Failed to connect to the knowledge engine.'}` }]);
        } finally {
            setLoading(false);
        }
    };

    const getIconForType = (type, url = '') => {
        const lowerUrl = url?.toLowerCase() || '';
        if (type === 'image' || lowerUrl.match(/\.(jpeg|jpg|gif|png)$/)) return <ImageIcon size={16} />;
        if (type === 'video' || lowerUrl.match(/\.(mp4|webm|ogg)$/)) return <Video size={16} />;
        if (type === 'audio' || lowerUrl.match(/\.(mp3|wav|ogg)$/)) return <Music size={16} />;
        return <FileText size={16} />;
    };

    const toggleSourceExpansion = (id) => {
        setExpandedSources(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const renderSources = (sources) => {
        if (!sources || sources.length === 0) return null;
        return (
            <div className="sources-container">
                <h4 className="sources-title">Knowledge Sources Used:</h4>
                <div className="sources-list">
                    {sources.map((src, idx) => {
                        const sourceKey = src.id || `src-${idx}`;
                        const isExpanded = expandedSources[sourceKey];
                        
                        return (
                            <div 
                                key={sourceKey} 
                                className={`source-card ${isExpanded ? 'expanded' : ''}`}
                                onClick={(e) => {
                                    if (e.target.closest('.source-link')) return; // Ensure interior links still work
                                    if (src.file_url) {
                                        window.open(src.file_url, '_blank', 'noopener,noreferrer');
                                    } else {
                                        toggleSourceExpansion(sourceKey);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                                title={src.file_url ? "Click to open file" : "Click to expand text"}
                            >
                                <div className="source-header">
                                    <span className={`source-badge ${src.source === 'graph' ? 'badge-graph' : 'badge-vector'}`}>
                                        {src.source === 'graph' ? 'Graph Match' : 'Semantic Match'}
                                    </span>
                                    {src.file_url ? (
                                        <a href={src.file_url} target="_blank" rel="noopener noreferrer" className="source-link" title="Open Source File">
                                            {getIconForType(src.content_type, src.file_url)}
                                            <LinkIcon size={14} style={{ marginLeft: '4px' }} />
                                        </a>
                                    ) : (
                                        <span className="source-link-disabled"><FileText size={16} /> Text</span>
                                    )}
                                </div>
                                <div className="source-body">
                                    <p>{src.page_content}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="chat-engine-container">
            <div className="search-header-minimal">
                <h1><Bot size={24} color="#4f46e5" /> Ethnoverse AI</h1>
                <div className="chat-filters">
                    <select
                        value={communityId}
                        onChange={(e) => setCommunityId(e.target.value)}
                        className="search-filter"
                    >
                        <option value="All">All Communities</option>
                        {communities.map((comm) => (
                            <option key={comm.id} value={comm.id}>{comm.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="chat-messages">
                {chatHistory.length === 0 && (
                    <div className="chat-empty-state">
                        <div className="empty-state-icon-wrapper">
                            <Bot size={40} />
                        </div>
                        <h3>How can I help you today?</h3>
                        <p style={{textAlign: 'center', maxWidth: '400px', lineHeight: '1.5'}}>
                            Ask a question about the community's history, rules, or shared knowledge. I'll search across all cultural archives to find the answer.
                        </p>
                    </div>
                )}

                {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`chat-message-row ${msg.role === 'user' ? 'row-user' : 'row-ai'}`}>
                        <div className="chat-message-content-wrapper">
                            <div className={`avatar ${msg.role === 'user' ? 'avatar-user' : 'avatar-ai'}`}>
                                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className="bubble-content">
                                {msg.content}
                                {msg.role === 'ai' && renderSources(msg.sources)}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="chat-message-row row-ai">
                        <div className="chat-message-content-wrapper">
                            <div className="avatar avatar-ai">
                                <Bot size={20} />
                            </div>
                            <div className="bubble-content loading-bubble">
                                <Bot size={16} className="pulsing" /> <em>Analyzing vectors and knowledge graphs...</em>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <form onSubmit={handleSendMessage} className="chat-input-form">
                    <input
                        type="text"
                        placeholder="Message Ethnoverse AI..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="chat-input"
                        disabled={loading}
                        autoFocus
                    />
                    <button type="submit" className="chat-send-btn" disabled={loading || !query.trim()}>
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Search;
