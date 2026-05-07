'use client';

import { useEffect, useState } from 'react';
import { fetchAnalytics } from '@/lib/api';
import { Loader2, AlertTriangle, BookOpen, Target, Award, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];

export default function SubjectAnalysisPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const analytics = await fetchAnalytics();
      setData(analytics.subject_wise || []);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No data available. Please upload an Excel file first.');
      } else {
        console.error(err);
        setError('Failed to load analytics data.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium">Analyzing Subject Competencies...</p>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-2">{error || 'No Data Found'}</h2>
        <p className="text-on-surface-variant mb-8 max-w-md">Upload results to see subject-specific performance breakdowns.</p>
        <Link 
          href="/upload" 
          className="px-8 py-3.5 bg-primary text-on-primary rounded-xl font-bold hover:shadow-lg transition-all"
        >
          Go to Upload Page
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-primary-container text-on-primary-container text-[10px] font-black uppercase tracking-widest rounded-full">
              Competency Map
            </div>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Subject Intelligence</h1>
          <p className="text-on-surface-variant text-lg">In-depth performance analysis for every subject in the curriculum.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.map((subject, idx) => (
          <div key={idx} className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">{subject.Subject}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{subject['Pass %']}% Pass Rate</span>
                    <div className="w-1 h-1 rounded-full bg-outline-variant" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Avg: {subject.Average}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="p-3 bg-surface border border-outline-variant rounded-2xl inline-block shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="h-3 w-3 text-secondary" />
                    <span className="text-xs font-bold text-on-surface">{subject['Topper Name']}</span>
                  </div>
                  <p className="text-[10px] font-bold text-outline uppercase">{subject['Topper Marks']} Marks</p>
                </div>
              </div>
            </div>

            <div className="h-48 w-full mt-6">
              <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <BarChart3 className="h-3 w-3" />
                Grade Distribution
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subject['Grade Distribution']}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="Grade" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#6b7280' }} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="Count" radius={[4, 4, 0, 0]} barSize={32}>
                    {subject['Grade Distribution'].map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.Grade === 'Fail' ? '#ef4444' : '#3b82f6'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Section Toppers List */}
            <div className="mt-8 pt-6 border-t border-outline-variant">
              <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Target className="h-3 w-3" />
                Section-wise Toppers
              </p>
              <div className="grid grid-cols-2 gap-3">
                {subject['Section Toppers'] && subject['Section Toppers'].length > 0 ? (
                  subject['Section Toppers'].map((st: any, i: number) => (
                    <div key={i} className="flex flex-col p-3 bg-surface-container-low border border-outline-variant rounded-xl hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-black text-primary uppercase bg-primary/5 px-1.5 py-0.5 rounded">Sec {st.Section}</span>
                        <span className="text-[10px] font-black text-primary">{st.Marks}</span>
                      </div>
                      <span className="text-xs font-bold text-on-surface truncate">{st.Name}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-4 text-center border border-dashed border-outline-variant/30 rounded-xl">
                    <p className="text-[10px] font-bold text-outline italic">No section data found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
