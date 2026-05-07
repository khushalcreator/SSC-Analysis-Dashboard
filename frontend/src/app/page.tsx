'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchAnalytics, resetData } from '@/lib/api';
import { Users, GraduationCap, TrendingUp, Trophy, AlertTriangle, Loader2, Filter, Trash2, Search, Award } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ClassPerformanceChart, 
  SectionPerformanceChart, 
  SubjectAverageChart, 
  GradeDistributionChart,
  SectionComparisonChart,
  SectionAvgPercentageChart
} from '@/components/DashboardCharts';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Filters state
  const [classFilter, setClassFilter] = useState('All Classes');
  const [sectionFilter, setSectionFilter] = useState('All Sections');
  const [gradeFilter, setGradeFilter] = useState('All Grades');
  const [appliedFilters, setAppliedFilters] = useState({ class: 'All Classes', section: 'All Sections', grade: 'All Grades' });

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyFilters = () => {
    setAppliedFilters({ class: classFilter, section: sectionFilter, grade: gradeFilter });
  };

  const filteredData = useMemo(() => {
    if (!data) return null;
    let { class_wise, section_wise, grade_distribution, subject_wise, overall } = data;

    if (appliedFilters.class !== 'All Classes') {
      const cls = appliedFilters.class.replace('Class ', '');
      class_wise = class_wise.filter((c: any) => String(c.Class) === cls);
      section_wise = section_wise.filter((s: any) => String(s.Class) === cls);
    }

    if (appliedFilters.section !== 'All Sections') {
      const sec = appliedFilters.section.replace('Section ', '');
      section_wise = section_wise.filter((s: any) => String(s.Section) === sec);
    }

    // Recalculate overall metrics based on filtered section_wise data
    if (appliedFilters.class !== 'All Classes' || appliedFilters.section !== 'All Sections') {
      const total_students = section_wise.reduce((acc: number, s: any) => acc + s['Student Count'], 0);
      const total_pass = section_wise.reduce((acc: number, s: any) => acc + (s['Student Count'] * s['Pass %'] / 100), 0);
      const pass_percentage = total_students > 0 ? (total_pass / total_students * 100) : 0;
      const average_percentage = section_wise.length > 0 
        ? (section_wise.reduce((acc: number, s: any) => acc + s['Avg %'], 0) / section_wise.length)
        : 0;

      // Find new topper/lowest from the filtered sections
      let filteredTopper = overall.topper;
      let filteredLowest = overall.lowest_performer;
      
      if (section_wise.length > 0) {
        const topSection = [...section_wise].sort((a: any, b: any) => b['Topper %'] - a['Topper %'])[0];
        const lowSection = [...section_wise].sort((a: any, b: any) => a['Lowest %'] - b['Lowest %'])[0];
        
        filteredTopper = { 
          Name: topSection['Topper Name'], 
          Percentage: topSection['Topper %'], 
          'Hall Ticket No': topSection['Topper HT'] 
        };
        filteredLowest = { 
          Name: lowSection['Lowest Name'], 
          Percentage: lowSection['Lowest %'], 
          'Hall Ticket No': lowSection['Lowest HT'] 
        };
      }

      overall = {
        ...overall,
        total_students,
        pass_percentage: round(pass_percentage, 2),
        average_percentage: round(average_percentage, 2),
        topper: filteredTopper,
        lowest_performer: filteredLowest
      };
    }

    // For Grade filtering, if selected, we narrow down the distribution
    if (appliedFilters.grade !== 'All Grades') {
      grade_distribution = grade_distribution.filter((g: any) => g.Grade === appliedFilters.grade);
    }

    return { ...data, class_wise, section_wise, grade_distribution, subject_wise, overall };
  }, [data, appliedFilters]);

  function round(num: number, decimalPlaces = 0) {
    const p = Math.pow(10, decimalPlaces);
    return Math.round((num + Number.EPSILON) * p) / p;
  }

  const loadData = async () => {
    try {
      setLoading(true);
      const analytics = await fetchAnalytics();
      setData(analytics);
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

  const handleClearData = async () => {
    if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      try {
        await resetData();
        window.location.reload();
      } catch (e) {
        alert("Failed to clear data");
      }
    }
  };

  const sectionComparisonData = useMemo(() => {
    const s_wise = filteredData?.section_wise || [];
    const classes = Array.from(new Set(s_wise.map((s: any) => s.Class)));
    return classes.map(cls => {
      const classSections = s_wise.filter((s: any) => s.Class === cls);
      const row: any = { Class: `Class ${cls}` };
      classSections.forEach((s: any) => {
        row[`Sec ${s.Section}`] = s["Pass %"];
      });
      return row;
    });
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  if (error || !data || !filteredData) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-2">{error || 'No Data Found'}</h2>
        <p className="text-on-surface-variant mb-8 max-w-md">Start by uploading your SSC results Excel file to generate comprehensive analytics and insights.</p>
        <Link 
          href="/upload"
          className="px-6 py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
        >
          Go to Upload Page
        </Link>
      </div>
    );
  }

  const { overall, class_wise, section_wise, subject_wise, grade_distribution } = filteredData;

  return (
    <div className="space-y-6">
      {/* Header with Clear Data */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-on-surface">Unified Results Dashboard</h2>
        <button 
          onClick={handleClearData}
          className="px-4 py-2 border border-error text-error rounded-lg font-medium hover:bg-error-container/20 transition-all flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear Data
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 mb-8 bg-surface-container-low p-5 rounded-3xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-on-surface-variant" />
          <span className="text-sm font-medium text-on-surface-variant">Filters:</span>
        </div>
        <select 
          value={classFilter} 
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option>All Classes</option>
          {Array.from(new Set(data.section_wise.map((s: any) => s.Class))).sort().map(cls => (
            <option key={cls}>Class {cls}</option>
          ))}
        </select>
        <select 
          value={sectionFilter} 
          onChange={(e) => setSectionFilter(e.target.value)}
          className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option>All Sections</option>
          {Array.from(new Set(data.section_wise.map((s: any) => s.Section))).sort().map(sec => (
            <option key={sec}>Section {sec}</option>
          ))}
        </select>
        <select 
          value={gradeFilter} 
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
        >
          <option>All Grades</option>
          <option>A+</option>
          <option>A</option>
          <option>B</option>
          <option>C</option>
          <option>D</option>
          <option>F</option>
        </select>
        <button 
          onClick={handleApplyFilters}
          className="px-6 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium ml-auto hover:bg-primary-container transition-colors shadow-sm active:scale-95"
        >
          Apply Filters
        </button>
      </div>

      {/* Primary KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-surface-container rounded-full opacity-50"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Students</span>
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-bold text-on-surface">{overall.total_students}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-surface-container rounded-full opacity-50"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pass Percentage</span>
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10 flex items-end gap-2">
            <span className="text-3xl font-bold text-on-surface">{overall.pass_percentage}%</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-surface-container rounded-full opacity-50"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Average %</span>
            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-3xl font-bold text-on-surface">{overall.average_percentage}%</span>
          </div>
        </div>
      </div>

      {/* Leaders Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* School Topper */}
        <div className="bg-primary rounded-3xl p-8 border border-primary/20 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Award className="h-32 w-32 text-on-primary" />
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-on-primary/10 flex items-center justify-center border border-on-primary/20">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${overall.topper?.Name}`} alt="Topper" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-on-primary/60 uppercase tracking-widest">School Topper</span>
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[8px] font-black uppercase rounded">Top 1%</span>
              </div>
              <h3 className="text-2xl font-black text-on-primary mb-1">{overall.topper?.Name}</h3>
              <div className="flex items-center gap-4 text-on-primary/80">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tight">Percentage</span>
                  <span className="text-lg font-bold">{overall.topper?.Percentage}%</span>
                </div>
                <div className="w-[1px] h-8 bg-on-primary/20" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tight">HT No</span>
                  <span className="text-lg font-bold">{overall.topper?.['Hall Ticket No']}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lowest Performer */}
        <div className="bg-surface-container-highest rounded-3xl p-8 border border-outline-variant shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-32 w-32 text-on-surface" />
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-surface-container-low flex items-center justify-center border border-outline-variant">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${overall.lowest_performer?.Name}`} alt="Lowest" className="w-full h-full object-cover opacity-80 grayscale" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-outline uppercase tracking-widest">Action Required</span>
                <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[8px] font-black uppercase rounded">Needs Help</span>
              </div>
              <h3 className="text-2xl font-black text-on-surface mb-1">{overall.lowest_performer?.Name}</h3>
              <div className="flex items-center gap-4 text-on-surface-variant">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tight">Percentage</span>
                  <span className="text-lg font-bold text-error">{overall.lowest_performer?.Percentage}%</span>
                </div>
                <div className="w-[1px] h-8 bg-outline-variant/30" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tight">HT No</span>
                  <span className="text-lg font-bold">{overall.lowest_performer?.['Hall Ticket No']}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ClassPerformanceChart data={class_wise} />
        <SectionComparisonChart data={sectionComparisonData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SectionAvgPercentageChart data={section_wise} />
        <GradeDistributionChart data={grade_distribution} />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <SubjectAverageChart data={subject_wise} />
      </div>
    </div>
  );
}
