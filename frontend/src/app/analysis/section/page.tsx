'use client';

import { useEffect, useState } from 'react';
import { fetchAnalytics } from '@/lib/api';
import { Loader2, AlertTriangle, TrendingUp, Users, Award, Target, Filter } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SectionAnalysisPage() {
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
      setData(analytics.section_wise || []);
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
        <p className="text-on-surface-variant font-medium">Decoding Section Metrics...</p>
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
        <p className="text-on-surface-variant mb-8 max-w-md">Start by uploading your SSC results Excel file to generate comprehensive analytics and insights.</p>
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
            <div className="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-black uppercase tracking-widest rounded-full">
              Granular View
            </div>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Section Intelligence</h1>
          <p className="text-on-surface-variant text-lg">Micro-level performance breakdown across individual cohorts.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="p-4 bg-surface border border-outline-variant rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-tertiary/10 rounded-xl flex items-center justify-center">
              <Filter className="h-5 w-5 text-tertiary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Sections</p>
              <p className="text-xl font-black text-on-surface">{data.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface/50 border-b border-outline-variant">
              <tr>
                {[
                  { label: 'Class & Section', icon: Target },
                  { label: 'Cohort Size', icon: Users },
                  { label: 'Pass %', icon: Target },
                  { label: 'Avg %', icon: TrendingUp },
                  { label: 'Section Topper', icon: Award },
                  { label: 'Lower Bound', icon: AlertTriangle },
                ].map((col, i) => (
                  <th key={i} className="px-8 py-6 font-bold text-outline uppercase tracking-widest text-[10px]">
                    <div className="flex items-center gap-2">
                      <col.icon className="h-3 w-3 text-primary" />
                      {col.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {data.map((item, idx) => (
                <tr key={idx} className="group hover:bg-tertiary/5 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface border border-outline-variant rounded-xl flex items-center justify-center font-black text-on-surface group-hover:border-tertiary transition-colors">
                        {item.Section}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">Section {item.Section}</span>
                        <span className="text-[10px] font-bold text-outline uppercase">Standard {item.Class}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-on-surface text-lg">{item['Student Count']}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <span className="font-black text-secondary text-lg">{item['Pass %']}%</span>
                      <div className="w-24 h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: `${item['Pass %']}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <span className="font-black text-primary text-lg">{item['Avg %']}%</span>
                      <div className="w-24 h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${item['Avg %']}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="p-3 bg-secondary-container/10 border border-secondary/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="h-3 w-3 text-secondary" />
                        <span className="font-bold text-on-surface text-sm">{item['Topper Name']}</span>
                      </div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{item['Topper HT']}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="p-3 bg-error-container/10 border border-error/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-3 w-3 text-error" />
                        <span className="font-bold text-on-surface text-sm">{item['Lowest Name']}</span>
                      </div>
                      <span className="text-[10px] font-bold text-error uppercase tracking-wider">{item['Lowest HT']}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
