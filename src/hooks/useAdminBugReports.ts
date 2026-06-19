import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';

export interface BugReport {
  id: string;
  title: string;
  description: string;
  category: string;
  context: Record<string, unknown> | null;
  status: BugReportStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: { username: string } | null;
}

export function useAdminBugReports() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('bug_reports')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false });

    if (err) {
      setError('Failed to load bug reports.');
      setLoading(false);
      return;
    }
    setReports((data ?? []) as BugReport[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateStatus = useCallback(
    async (id: string, status: BugReportStatus): Promise<void> => {
      // Optimistic update
      setReports((prev) =>
        prev.map((report) =>
          report.id === id ? { ...report, status } : report
        )
      );

      // Persist to database
      const { error: err } = await supabase
        .from('bug_reports')
        .update({ status })
        .eq('id', id);

      if (err) {
        console.error('Failed to update bug report status:', err);
      }
    },
    []
  );

  const updateNotes = useCallback(
    async (id: string, admin_notes: string): Promise<void> => {
      // Optimistic update
      setReports((prev) =>
        prev.map((report) =>
          report.id === id ? { ...report, admin_notes } : report
        )
      );

      // Persist to database
      const { error: err } = await supabase
        .from('bug_reports')
        .update({ admin_notes })
        .eq('id', id);

      if (err) {
        console.error('Failed to update bug report notes:', err);
      }
    },
    []
  );

  return { reports, loading, error, updateStatus, updateNotes };
}
