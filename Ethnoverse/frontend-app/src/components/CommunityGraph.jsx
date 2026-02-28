import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../api/axios';

const CommunityGraph = ({ communityId }) => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [hoverNode, setHoverNode] = useState(null);

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                // Use the correct port for AI Agent service
                const res = await api.get(`http://localhost:8002/graph/${communityId}`);

                const formatted = {
                    nodes: res.data.nodes.map(n => ({ id: n.id, ...n.properties, group: n.labels.includes('Content') ? 'Content' : (n.labels[0] || 'Unknown'), isContent: n.labels.includes('Content'), type: n.properties.content_type })),
                    links: res.data.edges.map(e => ({ source: e.source, target: e.target, ...e.properties }))
                };
                setGraphData(formatted);
            } catch (error) {
                console.error("Failed to fetch community graph:", error);
            } finally {
                setLoading(false);
            }
        };

        if (communityId) {
            fetchGraph();
        }
    }, [communityId]);

    if (loading) return <div>Loading graph...</div>;

    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', height: '600px', backgroundColor: '#f9f9f9' }}>
            {graphData.nodes.length > 0 ? (
                <ForceGraph2D
                    graphData={graphData}
                    nodeLabel={() => ''} // Disable default tooltip
                    nodeAutoColorBy="group"
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    width={800} // Rough width, ideally responsive container
                    height={600}
                    onNodeHover={node => setHoverNode(node || null)}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const label = node.name || node.id;
                        const fontSize = 12 / globalScale;
                        const isHovered = node === hoverNode;

                        // Draw Node Circle
                        const isContent = node.isContent;
                        const r = isContent ? 8 : 5;
                        ctx.beginPath();

                        if (isContent) {
                            ctx.rect(node.x - r, node.y - r, r * 2, r * 2);
                        } else {
                            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        }

                        ctx.fillStyle = isContent ? '#ff9933' : (node.color || '#333');
                        ctx.fill();

                        // Draw Label (only if hovered)
                        if (isHovered) {
                            ctx.font = `${fontSize}px Sans-Serif`;
                            let displayLabel = label;
                            if (isContent) {
                                displayLabel = `[${node.type || 'Content'}] ${label.substring(0, 15)}...`;
                            }
                            const textWidth = ctx.measureText(displayLabel).width;
                            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] - r - 2, bckgDimensions[0], bckgDimensions[1]);

                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = isContent ? '#ff9933' : (node.color || '#333');
                            ctx.fillText(displayLabel, node.x, node.y - r - fontSize / 2 - 2);
                        }
                    }}
                    nodeCanvasObjectMode={() => 'replace'} // We draw everything
                />
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                    No knowledge graph data yet for this community.
                </div>
            )}
        </div>
    );
};

export default CommunityGraph;
