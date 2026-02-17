import React, { useState, useEffect } from 'react';
import { supabase } from './config';
import AdminShell from './components/AdminShell';
import ViewerAccess from './components/ViewerAccess';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [mode, setMode] = useState('admin'); // 'admin' | 'viewer'

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading state
  if (session === undefined) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span className="text-muted">Loading DateUp...</span>
      </div>
    );
  }

  // Route to viewer
  if (mode === 'viewer') {
    return <ViewerAccess onBack={() => setMode('admin')} />;
  }

  // Route to admin
  return <AdminShell session={session} onSwitchToViewer={() => setMode('viewer')} />;
}
