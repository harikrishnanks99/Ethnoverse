import React, { useState, useEffect } from 'react';
import { Network, Activity, FileText, CheckCircle, ChevronRight, Globe, Headphones, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { searchApi } from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    audioCount: 0,
    documentCount: 0,
    communityCount: 0,
    recentActivity: [],
    connectionsCount: 0,
    communityReach: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [contentRes, graphRes, communitiesRes] = await Promise.all([
          searchApi.get('/content'),
          searchApi.get('/graph'),
          api.get('/communities/')
        ]);

        const documents = contentRes.data || [];
        const graphData = graphRes.data || { links: [] };
        const communities = communitiesRes.data || [];

        // Calculate audio vs document count
        let audioCount = 0;
        let documentCount = 0;
        
        documents.forEach(doc => {
          if (doc.metadata && doc.metadata.content_type === 'audio') {
            audioCount++;
          } else {
            documentCount++;
          }
        });

        // Recent Activity
        const recentDocs = [...documents].reverse().slice(0, 3);
        const recentActivityRows = recentDocs.map(doc => ({
          title: doc.metadata?.title || doc.metadata?.source || 'Unknown Artifact',
          subtext: doc.metadata?.content_type === 'audio' ? 'AI Audio Transcription Completed' : 'AI Text/Context Analysis Completed',
          status: 'COMPLETED',
          statusColor: '#16a34a',
          statusBg: '#dcfce7'
        }));

        // Knowledge Expansion
        const connectionsCount = graphData.links ? graphData.links.length : 0;

        // Community Reach mapping
        const communityCounts = {};
        documents.forEach(doc => {
          const commId = doc.metadata?.community_id;
          if (commId) {
            communityCounts[commId] = (communityCounts[commId] || 0) + 1;
          }
        });
        
        const totalDocsForPercentage = documents.length > 0 ? documents.length : 1;
        
        const reachInfo = Object.keys(communityCounts).map(commId => {
          const community = communities.find(c => c.id.toString() === commId.toString());
          return {
            id: commId,
            name: community ? community.name : `Community ${commId}`,
            count: communityCounts[commId],
            percentage: Math.round((communityCounts[commId] / totalDocsForPercentage) * 100)
          };
        }).sort((a, b) => b.count - a.count).slice(0, 3);

        const colors = ['#0d9488', '#d97706', '#4f46e5'];
        const communityReachBars = reachInfo.map((r, i) => ({
          label: r.name,
          percentage: r.percentage,
          color: colors[i % colors.length]
        }));

        // Fill with mock community reach if empty to preserve ui layout temporarily if no data
        if (communityReachBars.length === 0) {
            communityReachBars.push({ label: "Global Scope", percentage: 100, color: colors[0] });
        }
        
        // Fill recent activity if empty
        if (recentActivityRows.length === 0) {
            recentActivityRows.push({
                title: "No recent activity yet.",
                subtext: "Upload artifacts to see them here.",
                status: "EMPTY",
                statusColor: "#64748b",
                statusBg: "#f1f5f9"
            });
        }

        setStats({
          audioCount,
          documentCount,
          communityCount: communities.length,
          recentActivity: recentActivityRows,
          connectionsCount,
          communityReach: communityReachBars
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="lucide-spin" size={48} color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header Greeting */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 700, 
          fontFamily: 'serif', 
          color: 'var(--color-primary)', 
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px'
        }}>
          Welcome back, Archivist.
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: 'var(--color-text-muted)', 
          margin: 0,
          fontWeight: 400
        }}>
          Your efforts have preserved {stats.audioCount + stats.documentCount} heritage artifacts in the system.
        </p>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <MetricCard 
          icon={<Headphones size={24} color="#3b82f6" />}
          bg="#eff6ff"
          title="Preserved Oral Histories"
          value={stats.audioCount.toLocaleString()}
          trend="Audio"
          progress={stats.audioCount > 0 ? 100 : 0}
          progressColor="#3b82f6"
        />
        <MetricCard 
          icon={<FileText size={24} color="#8b5cf6" />}
          bg="#f5f3ff"
          title="Digitized Documents"
          value={stats.documentCount.toLocaleString()}
          trend="Text"
          progress={stats.documentCount > 0 ? 100 : 0}
          progressColor="#8b5cf6"
        />
        <MetricCard 
          icon={<Globe size={24} color="#10b981" />}
          bg="#ecfdf5"
          title="Communities Represented"
          value={stats.communityCount.toLocaleString()}
          trend="Active"
          progress={stats.communityCount > 0 ? 100 : 0}
          progressColor="#10b981"
        />
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
        
        {/* Left Column: Recent Activity */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-dark)' }}>Recent Activity</h2>
            <button 
              onClick={() => navigate('/explorer')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              View All <ChevronRight size={16} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stats.recentActivity.map((activity, index) => (
              <ActivityRow 
                key={index}
                title={activity.title}
                subtext={activity.subtext}
                status={activity.status}
                statusColor={activity.statusColor}
                statusBg={activity.statusBg}
                isLast={index === stats.recentActivity.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Knowledge Expansion & Community Reach */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Knowledge Expansion Card */}
          <div style={{ 
            backgroundColor: '#0f172a',
            borderRadius: '16px', 
            padding: '24px', 
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background pattern/glow */}
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, rgba(15,23,42,0) 70%)', borderRadius: '50%' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Network size={20} color="#38bdf8" />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '4px 8px', borderRadius: '20px', letterSpacing: '0.5px' }}>
                LIVE NODE
              </span>
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 12px 0', lineHeight: 1.3, position: 'relative', zIndex: 1 }}>
              Knowledge Expansion
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px 0', position: 'relative', zIndex: 1 }}>
              The AI has identified {stats.connectionsCount} cross-community connections in the knowledge graph.
            </p>
            
            <button 
                onClick={() => navigate('/knowledge-graph')}
                style={{ 
                width: '100%', padding: '12px', borderRadius: '8px', border: 'none', 
                backgroundColor: 'white', color: '#0f172a', fontWeight: 600, fontSize: '0.95rem',
                cursor: 'pointer', position: 'relative', zIndex: 1, transition: 'background-color 0.2s'
            }}>
              Review Connections
            </button>
          </div>

          {/* Community Reach Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 20px 0', color: 'var(--color-text-dark)' }}>Community Reach</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {stats.communityReach.map((reach, index) => (
                <ProgressRow 
                  key={index} 
                  label={reach.label} 
                  percentage={reach.percentage} 
                  color={reach.color} 
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon, bg, title, value, trend, progress, progressColor }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '20px' }}>
        {trend}
      </span>
    </div>
    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
      {title}
    </span>
    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-dark)', marginBottom: '20px', display: 'block', letterSpacing: '-0.5px' }}>
      {value}
    </span>
    <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginTop: 'auto' }}>
      <div style={{ height: '100%', width: `${progress}%`, backgroundColor: progressColor, borderRadius: '3px' }}></div>
    </div>
  </div>
);

const ActivityRow = ({ title, subtext, status, statusColor, statusBg, isLast }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f8fafc', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {status === 'COMPLETED' ? <CheckCircle size={18} color="#16a34a" /> : <Activity size={18} color="#94a3b8" />}
      </div>
      <div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{subtext}</p>
      </div>
    </div>
    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColor, backgroundColor: statusBg, padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.5px' }}>
      {status}
    </span>
  </div>
);

const ProgressRow = ({ label, percentage, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{percentage}%</span>
    </div>
    <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: color, borderRadius: '4px' }}></div>
    </div>
  </div>
);

export default Dashboard;

