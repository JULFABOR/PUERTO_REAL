import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const DebugOverlay = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  return (
    <div style={{position: 'fixed', right: 12, bottom: 12, zIndex: 9999}}>
      <div style={{background: 'rgba(17,24,39,0.9)', color: '#e5e7eb', padding: '8px 10px', borderRadius: 8, fontSize: 12, maxWidth: 340}}>
        <div style={{fontWeight: '700', color: '#fbbf24', marginBottom: 6}}>DEBUG</div>
        <div><strong>URL:</strong> {location.pathname}</div>
        <div><strong>loading:</strong> {String(loading)}</div>
        <div style={{marginTop:6}}><strong>user:</strong></div>
        <pre style={{whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto', margin:0}}>{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DebugOverlay;
