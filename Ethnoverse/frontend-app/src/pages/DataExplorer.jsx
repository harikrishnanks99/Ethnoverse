import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../api/axios';

const DataExplorer = () => {
    const [view, setView] = useState('graph'); // 'graph' or 'content'
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [contentData, setContentData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (view === 'graph') {
                    // Direct call to AI Agent Service on port 8002
                    const res = await api.get('http://localhost:8002/graph');
                    // Transform for react-force-graph if needed
                    // Backend returns { nodes: [...], edges: [...] }
                    // Library expects { nodes: [...], links: [...] }
                    const formatted = {
                        nodes: res.data.nodes.map(n => ({ id: n.id, ...n.properties, group: n.labels[0] })),
                        links: res.data.edges.map(e => ({ source: e.source, target: e.target, ...e.properties }))
                    };
                    setGraphData(formatted);
                } else {
                    // Direct call to AI Agent Service on port 8002
                    const res = await api.get('http://localhost:8002/content');
                    setContentData(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [view]);

    return (
        <div style={{ padding: '20px' }}>
            <h1>Data Explorer</h1>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => setView('graph')}
                    className={`btn ${view === 'graph' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ marginRight: '10px' }}
                >
                    Knowledge Graph
                </button>
                <button
                    onClick={() => setView('content')}
                    className={`btn ${view === 'content' ? 'btn-primary' : 'btn-secondary'}`}
                >
                    Content List
                </button>
            </div>

            {loading && <p>Loading data...</p>}

            {!loading && view === 'graph' && (
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                    <ForceGraph2D
                        graphData={graphData}
                        nodeLabel="name"
                        nodeAutoColorBy="group"
                        linkDirectionalArrowLength={3.5}
                        linkDirectionalArrowRelPos={1}
                        width={window.innerWidth - 80}
                        height={600}
                    />
                </div>
            )}

            {!loading && view === 'content' && (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {contentData.map((doc, idx) => (
                        <div key={idx} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: 'white' }}>
                            <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>ID: {doc.metadata?.content_id}</div>
                            <div style={{ fontSize: '0.9em', color: '#666' }}>Type: {doc.metadata?.source}</div>
                            <p style={{ marginTop: '10px' }}>{doc.page_content.substring(0, 200)}...</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DataExplorer;
