import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Filter, ChevronDown, Plus, Minus, Target, X, Users, MapPin, Calendar, Brain, Search, BookOpen, User, ChevronRight, Info, Link as LinkIcon, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const KnowledgeGraph = () => {
    const navigate = useNavigate();
    const fgRef = useRef();
    const [selectedNode, setSelectedNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef();

    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(false);

    // Search & filter state
    const [searchQ, setSearchQ]               = useState('');
    const [entityTypeFilter, setEntityTypeFilter] = useState('');
    const [communityFilt, setCommunityFilt]   = useState('');

    // Color/Visual mappings based on node labels
    const getColorForLabel = (label) => {
        const colors = {
            'Community': '#312e81',     // Dark Blue
            'Person': '#2DD4BF',        // Teal
            'Event': '#F87171',         // Red
            'Location': '#FBBF24',      // Yellow
            'Concept': '#A78BFA',       // Purple
            'Document': '#3b82f6',      // Blue
            'Audio': '#f43f5e',         // Rose
        };
        return colors[label] || '#94a3b8'; // Slate Default
    };

    const getIconForLabel = (label, color) => {
        const icons = {
            'Community': <Users size={20} color={color || "#312e81"} />,
            'Person': <User size={20} color={color || "#0d9488"} />,
            'Event': <Calendar size={20} color={color || "#b45309"} />,
            'Location': <MapPin size={20} color={color || "#d97706"} />,
            'Concept': <Brain size={20} color={color || "#7e22ce"} />,
        };
        return icons[label] || <FileText size={20} color={color || "#475569"} />;
    };

    const getBgColorForLabel = (label) => {
        const bgColors = {
            'Community': '#e0e7ff',
            'Person': '#ccfbf1',
            'Event': '#fee2e2',
            'Location': '#fef3c7',
            'Concept': '#f3e8ff',
        };
        return bgColors[label] || '#f1f5f9';
    };

    // Fetch Real Neo4j Graph Data
    useEffect(() => {
        const fetchGraphData = async () => {
            setLoading(true);
            try {
                const res = await api.get('http://localhost:8002/graph');
                
                // Extract edges array - handle different possible backend response structures
                const edges = res.data.edges || res.data.relationships || [];
                const nodes = res.data.nodes || [];

                if (nodes.length > 0) {
                    const formatted = {
                        nodes: nodes.map(n => {
                            const label = n.labels && n.labels.length > 0 ? n.labels[0] : 'Entity';
                            let nodeVal = 10; // Default small size
                            if(label === 'Community') nodeVal = 20;
                            if(label === 'Concept') nodeVal = 16;
                            
                            return { 
                                id: n.id, 
                                ...n.properties, 
                                group: label,
                                val: nodeVal,
                                color: getColorForLabel(label),
                                name: n.properties?.name || n.properties?.title || n.id,
                                type: label.toUpperCase(),
                                description: n.properties?.description || n.properties?.content || ''
                            };
                        }),
                        links: edges.map(e => ({ 
                            source: e.source, 
                            target: e.target, 
                            ...e.properties,
                            color: '#cbd5e1'
                        }))
                    };
                    setGraphData(formatted);
                } else {
                    setGraphData({ nodes: [], links: [] });
                }
            } catch (err) {
                console.error("Failed to fetch graph data from Neo4j", err);
                setGraphData({ nodes: [], links: [] });
            } finally {
                setLoading(false);
            }
        };
        fetchGraphData();
    }, []);

    // --- Derived filtered graph -------------------------------------------
    // Distinct values for dropdown options
    const allEntityTypes = [...new Set(graphData.nodes.map(n => n.group).filter(Boolean))].sort();
    const allCommunities = [...new Set(
        graphData.nodes.filter(n => n.group === 'Community').map(n => n.name).filter(Boolean)
    )].sort();

    const filteredNodes = graphData.nodes.filter(n => {
        const matchesSearch  = !searchQ       || (n.name || n.id || '').toLowerCase().includes(searchQ.toLowerCase());
        const matchesType    = !entityTypeFilter || n.group === entityTypeFilter;
        const matchesCommunity = !communityFilt || n.name === communityFilt || n.group !== 'Community';
        return matchesSearch && matchesType && matchesCommunity;
    });
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = graphData.links.filter(l => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        return filteredNodeIds.has(srcId) && filteredNodeIds.has(tgtId);
    });
    const filteredGraphData = { nodes: filteredNodes, links: filteredLinks };
    // -----------------------------------------------------------------------

    // Effect to configure advanced d3 physics once graph reference is available
    useEffect(() => {
        if (fgRef.current && !loading && graphData.nodes.length > 0) {
            // Increase repulsive force between nodes to spread them out
            fgRef.current.d3Force('charge').strength(-400).distanceMax(500);
            
            // Increase default link length
            fgRef.current.d3Force('link').distance(80);
            
            // Re-ignite physics engine to apply new forces
            fgRef.current.d3ReheatSimulation();
        }
    }, [graphData, loading]);

    // Responsive canvas sizing
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        updateDimensions();
        setTimeout(updateDimensions, 100);
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const renderNodeIcon = (node, ctx, globalScale) => {
        const size = node.val;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = node.color;
        ctx.stroke();

        if (selectedNode && node.id === selectedNode.id) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, size + 8, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(224, 231, 255, 0.4)'; 
            ctx.fill();
        }

        const fontSize = 12/globalScale;
        ctx.font = `600 ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(node.name || node.id, node.x, node.y + size + 4);
    };

    // Helper to find related nodes for the details panel
    const getRelatedNodes = () => {
        if (!selectedNode || !graphData.links) return [];
        const related = [];
        
        // Find links where selected node is source or target
        graphData.links.forEach(link => {
            if (link.source.id === selectedNode.id || link.source === selectedNode.id) {
                const targetNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
                if(targetNode) related.push(targetNode);
            } else if (link.target.id === selectedNode.id || link.target === selectedNode.id) {
                const sourceNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
                if(sourceNode) related.push(sourceNode);
            }
        });
        
        // Return unique nodes, limit to 5
        const uniqueRelated = [...new Map(related.map(item => [item.id, item])).values()];
        return uniqueRelated.slice(0, 5);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', backgroundColor: '#f8fafc', padding: '0' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e1b4b', margin: 0 }}>Knowledge Graph</h1>

                {/* Search bar */}
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: '30px', padding: '10px 20px', border: '1px solid #e2e8f0', width: '350px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                    <Search size={18} color="#94a3b8" />
                    <input
                        type="text"
                        placeholder="Search entities, connections, or stories..."
                        value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                        style={{ border: 'none', outline: 'none', padding: '0 12px', fontSize: '0.95rem', flex: 1, color: '#1e293b', background: 'none' }}
                    />
                    {searchQ && (
                        <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                            <X size={16} color="#94a3b8" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter toolbar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Community filter */}
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <select
                        value={communityFilt}
                        onChange={e => setCommunityFilt(e.target.value)}
                        style={{
                            appearance: 'none', backgroundColor: 'white', border: '1px solid #cbd5e1',
                            padding: '10px 36px 10px 16px', borderRadius: '8px', fontSize: '0.9rem',
                            fontWeight: 600, color: communityFilt ? '#1e1b4b' : '#475569',
                            cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            fontFamily: 'inherit', outline: 'none',
                        }}
                    >
                        <option value="">Filter by community</option>
                        {allCommunities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#475569' }} />
                </div>

                {/* Entity type filter */}
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <select
                        value={entityTypeFilter}
                        onChange={e => setEntityTypeFilter(e.target.value)}
                        style={{
                            appearance: 'none', backgroundColor: 'white', border: '1px solid #cbd5e1',
                            padding: '10px 36px 10px 16px', borderRadius: '8px', fontSize: '0.9rem',
                            fontWeight: 600, color: entityTypeFilter ? '#1e1b4b' : '#475569',
                            cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            fontFamily: 'inherit', outline: 'none',
                        }}
                    >
                        <option value="">Filter by entity type</option>
                        {allEntityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: '#475569' }} />
                </div>

                {/* Clear all */}
                {(searchQ || communityFilt || entityTypeFilter) && (
                    <button
                        onClick={() => { setSearchQ(''); setCommunityFilt(''); setEntityTypeFilter(''); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none',
                            padding: '10px 16px', borderRadius: '8px', fontSize: '0.9rem',
                            fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        <X size={14} /> Clear filters
                    </button>
                )}

                {/* Active filter count */}
                {filteredNodes.length < graphData.nodes.length && (
                    <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: 'auto' }}>
                        Showing <strong>{filteredNodes.length}</strong> of {graphData.nodes.length} nodes
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', flex: 1, gap: '24px', position: 'relative', overflow: 'hidden' }}>
                
                <div 
                    ref={containerRef}
                    style={{ 
                        flex: 1, 
                        backgroundColor: 'white', 
                        borderRadius: '16px', 
                        border: '1px solid #e2e8f0', 
                        position: 'relative',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        overflow: 'hidden'
                    }}
                >
                    {loading && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                            <div style={{ padding: '16px 32px', backgroundColor: '#1e1b4b', color: 'white', borderRadius: '30px', fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 10px 25px rgba(30,27,75, 0.3)' }}>
                                Querying Neo4j Archives...
                            </div>
                        </div>
                    )}
                    
                    {!loading && graphData.nodes.length === 0 && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, flexDirection: 'column', gap: '16px' }}>
                             <Target size={48} color="#cbd5e1" />
                             <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>No connection data found in database.</p>
                        </div>
                    )}

                    {!loading && dimensions.width > 0 && filteredGraphData.nodes.length > 0 && (
                        <ForceGraph2D
                            ref={fgRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            graphData={filteredGraphData}
                            nodeCanvasObject={renderNodeIcon}
                            nodeRelSize={8}
                            linkWidth={1}
                            linkColor={link => link.color || '#cbd5e1'}
                            // Tweak d3 physics to reduce clutter
                            d3AlphaDecay={0.02}
                            d3VelocityDecay={0.3}
                            onEngineStop={() => fgRef.current?.zoomToFit(400, 50)} // auto-fit when settled
                            onNodeClick={(node) => {
                                 setSelectedNode(node);
                                 if (fgRef.current && dimensions.width > 0) {
                                     // When panel opens, the available visual center shifts left
                                     // Panel width is 400px, so offset the center by roughly 200px equivalent
                                     // Map screen offset to graph coordinates based on current zoom
                                     const currentZoom = fgRef.current.zoom();
                                     // Target zoom level
                                     const targetZoom = 3; 
                                     
                                     // Calculate coordinate offset needed to shift node to the left visually
                                     // 400px panel / 2 = 200px shift from true center
                                     const offsetX = 200 / targetZoom;

                                     fgRef.current.centerAt(
                                         node.x + offsetX, // Shift look-at point right, making node appear left
                                         node.y, 
                                         1000
                                     );
                                     fgRef.current.zoom(targetZoom, 2000); 
                                 }
                            }}
                            cooldownTicks={150}
                        />
                    )}

                    {/* Floating Controls (Bottom Left) - ensure zIndex is high enough to sit above canvas but not panel */}
                    <div style={{ position: 'absolute', bottom: '24px', left: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
                        <button onClick={() => { if(fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.5, 400); }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={20} color="#475569" />
                        </button>
                        <button onClick={() => { if(fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.5, 400); }} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus size={20} color="#475569" />
                        </button>
                        <button onClick={() => fgRef.current?.zoomToFit(400)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
                            <Target size={20} color="#475569" />
                        </button>
                    </div>
                </div>

                {/* Right Side Detail Panel - Added pointerEvents control */}
                <div style={{ 
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    height: '100%',
                    width: selectedNode ? '400px' : '0', 
                    opacity: selectedNode ? 1 : 0, 
                    pointerEvents: selectedNode ? 'auto' : 'none', // Prevents invisible panel from blocking clicks
                    backgroundColor: 'white', 
                    borderLeft: '1px solid #e2e8f0', 
                    boxShadow: '-10px 0 25px rgba(0,0,0,0.05)', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 20
                }}>
                    {selectedNode && (
                        <>
                            <div style={{ height: '180px', backgroundColor: '#e2e8f0', backgroundImage: `url('https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                                <button onClick={() => setSelectedNode(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}>
                                    <X size={18} color="#1e293b" />
                                </button>
                            </div>

                            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                                <div style={{ display: 'inline-block', backgroundColor: '#fef3c7', color: '#b45309', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '16px' }}>
                                    {selectedNode.type}
                                </div>
                                
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e1b4b', margin: '0 0 16px 0', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
                                    {selectedNode.name || selectedNode.id}
                                </h2>

                                <p style={{ fontSize: '1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
                                    {selectedNode.description || "No specific detailed description is available within the graph database for this entity."}
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>DATABASE ID</span>
                                        <span style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 600, fontFamily: 'monospace' }}>{selectedNode.id}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>NEIGHBORS</span>
                                        <span style={{ fontSize: '1rem', color: '#10b981', fontWeight: 600 }}>{getRelatedNodes().length} Links</span>
                                    </div>
                                </div>

                                {getRelatedNodes().length > 0 && (
                                    <>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', margin: '0 0 16px 0' }}>Related Nodes</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {getRelatedNodes().map(related => (
                                                <div key={related.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', backgroundColor: 'white', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onClick={() => {
                                                    setSelectedNode(related);
                                                    if (fgRef.current) fgRef.current.centerAt(related.x, related.y, 1000);
                                                }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: getBgColorForLabel(related.group), display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
                                                        {getIconForLabel(related.group, related.color)}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{related.name || related.id}</h4>
                                                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{related.type}</span>
                                                    </div>
                                                    <ChevronRight size={18} color="#cbd5e1" />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                                <button 
                                    onClick={() => navigate(`/search?q=${encodeURIComponent(selectedNode.name || selectedNode.id)}`)}
                                    style={{ width: '100%', backgroundColor: '#1e1b4b', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,27,75, 0.2)', transition: 'background-color 0.2s' }}
                                >
                                    <BookOpen size={20} /> Inspect Archive Record
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeGraph;
