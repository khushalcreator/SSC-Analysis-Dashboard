'use client';

import { useEffect, useState } from 'react';
import { fetchAllStudents, downloadReportCard } from '@/lib/api';
import { Search, ChevronDown, ChevronUp, Loader2, AlertTriangle, X, Download, Star, Info } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PerformanceTrendChart } from '@/components/DashboardCharts';

type Student = {
  'Hall Ticket No': string | number;
  'Roll No': string | number;
  Name: string;
  Class: string | number;
  Section: string;
  Telugu: number;
  Hindi: number;
  English: number;
  Maths: number;
  Science: number;
  Social: number;
  Total: number;
  Percentage: number;
  Result: string;
  Grade: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof Student>('Percentage');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAllStudents();
      setStudents(data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No data available. Please upload an Excel file first.');
      } else {
        console.error(err);
        setError('Failed to load student data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Student) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // default to descending for new field
    }
  };

  const openStudentDetails = (student: Student) => {
    setSelectedStudent(student);
    setIsDrawerOpen(true);
  };

  const handleDownloadReportCard = async (student: Student) => {
    try {
      setIsDownloading(true);
      const blob = await downloadReportCard(student['Hall Ticket No']);
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_Card_${student['Hall Ticket No']}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to download report card.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium">Loading Student Data...</p>
      </div>
    );
  }

  if (error || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <div className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-2">{error || 'No Data Found'}</h2>
        <p className="text-on-surface-variant mb-8 max-w-md">Start by uploading your SSC results Excel file to view student records.</p>
        <Link 
          href="/upload" 
          className="px-6 py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
        >
          Go to Upload Page
        </Link>
      </div>
    );
  }

  // Find Topper
  const maxPercentage = Math.max(...students.map(s => s.Percentage));

  // Filter and Sort
  const filteredAndSorted = students
    .filter(s => {
      const searchTerm = search.toLowerCase();
      return (
        String(s['Hall Ticket No']).toLowerCase().includes(searchTerm) ||
        s.Name.toLowerCase().includes(searchTerm) ||
        String(s.Class).toLowerCase().includes(searchTerm) ||
        s.Section.toLowerCase().includes(searchTerm)
      );
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const renderSortIcon = (field: keyof Student) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  // Mock trend data
  const trendData = [
    { name: 'Term 1', percentage: 70 },
    { name: 'Term 2', percentage: 85 },
    { name: 'Mid Term', percentage: 75 },
    { name: 'Term 3', percentage: 92 },
    { name: 'Final', percentage: selectedStudent?.Percentage || 0 },
  ];

  return (
    <div className="space-y-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Student Data</h1>
          <p className="text-on-surface-variant mt-1">Detailed view of all student records and results.</p>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-on-surface-variant" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full sm:w-64 bg-surface text-on-surface transition-all"
            placeholder="Search HT No, Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-surface rounded-3xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-variant/30 border-b border-outline-variant">
              <tr>
                {[
                  { key: 'Hall Ticket No', label: 'HT No' },
                  { key: 'Name', label: 'Name' },
                  { key: 'Class', label: 'Class' },
                  { key: 'Section', label: 'Sec' },
                  { key: 'Total', label: 'Total' },
                  { key: 'Percentage', label: 'Percentage' },
                  { key: 'Grade', label: 'Grade' },
                  { key: 'Result', label: 'Result' },
                ].map((col) => (
                  <th 
                    key={col.key} 
                    className="px-6 py-4 font-semibold text-on-surface-variant uppercase tracking-wider text-xs cursor-pointer hover:bg-surface-variant transition-colors"
                    onClick={() => handleSort(col.key as keyof Student)}
                  >
                    <div className="flex items-center">
                      {col.label}
                      {renderSortIcon(col.key as keyof Student)}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 font-semibold text-on-surface-variant uppercase tracking-wider text-xs text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {filteredAndSorted.map((student) => {
                const isTopper = student.Percentage === maxPercentage;
                const isFail = student.Result === 'Fail';
                
                return (
                  <tr 
                    key={student['Hall Ticket No']} 
                    className={cn(
                      "hover:bg-surface-bright transition-colors group",
                      isTopper && "bg-secondary-container/10",
                      isFail && "bg-error-container/10"
                    )}
                  >
                    <td className="px-6 py-4 font-medium text-on-surface">
                      {student['Hall Ticket No']}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          isTopper ? "text-secondary" : isFail ? "text-error" : "text-on-surface"
                        )}>
                          {student.Name}
                        </span>
                        {isTopper && (
                          <Star className="h-3 w-3 text-secondary fill-secondary" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{student.Class}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{student.Section}</td>
                    <td className="px-6 py-4 text-on-surface-variant">{student.Total}/600</td>
                    <td className={cn(
                      "px-6 py-4 font-bold",
                      isTopper ? "text-secondary" : isFail ? "text-error" : "text-on-surface-variant"
                    )}>{student.Percentage}%</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold uppercase",
                        student.Grade === 'A+' ? "bg-primary-container/10 text-primary" :
                        student.Grade === 'A' ? "bg-primary-container/10 text-primary" :
                        student.Grade === 'B' ? "bg-primary-fixed text-on-primary-fixed" :
                        student.Grade === 'Fail' ? "bg-error-container text-error" :
                        "bg-outline-variant/30 text-on-surface-variant"
                      )}>
                        {student.Grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "font-bold",
                        student.Result === 'Pass' ? "text-secondary" : "text-error"
                      )}>
                        {student.Result}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openStudentDetails(student)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-full transition-colors"
                        title="View Details"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Side Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 w-full sm:w-[450px] bg-surface-container-lowest border-l border-outline-variant shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out",
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {selectedStudent && (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface">
              <h3 className="text-xl font-bold text-on-surface">Student Detail View</h3>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Demographic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center text-on-primary-fixed text-xl font-bold">
                    {selectedStudent.Name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-on-surface">{selectedStudent.Name}</h4>
                    <p className="text-sm text-outline">Roll No: {selectedStudent['Roll No']} • Class {selectedStudent.Class}-{selectedStudent.Section}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface border border-outline-variant rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-outline uppercase mb-1">Percentage</p>
                    <p className="text-lg font-bold text-primary">{selectedStudent.Percentage}%</p>
                  </div>
                  <div className="p-3 bg-surface border border-outline-variant rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-outline uppercase mb-1">Grade</p>
                    <p className="text-lg font-bold text-secondary">{selectedStudent.Grade}</p>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Subject-wise Breakdown</h5>
                <div className="space-y-4">
                  {[
                    { name: 'Telugu', marks: selectedStudent.Telugu },
                    { name: 'Hindi', marks: selectedStudent.Hindi },
                    { name: 'English', marks: selectedStudent.English },
                    { name: 'Maths', marks: selectedStudent.Maths },
                    { name: 'Science', marks: selectedStudent.Science },
                    { name: 'Social Studies', marks: selectedStudent.Social },
                  ].map((sub) => (
                    <div key={sub.name}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-on-surface-variant">{sub.name}</span>
                        <span className="font-bold text-primary">{sub.marks}/100</span>
                      </div>
                      <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            sub.marks >= 90 ? "bg-secondary" : sub.marks >= 35 ? "bg-primary" : "bg-error"
                          )}
                          style={{ width: `${sub.marks}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Trend */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Performance Trend</h5>
                <div className="bg-surface p-5 rounded-3xl border border-outline-variant shadow-sm">
                  <PerformanceTrendChart data={trendData} />
                  <div className="flex justify-between text-[10px] text-outline font-bold mt-2 px-2">
                    <span>Term 1</span>
                    <span>Term 2</span>
                    <span>Mid</span>
                    <span>Term 3</span>
                    <span className="text-primary">Final</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant bg-surface">
              <button 
                className={cn(
                  "w-full py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95",
                  isDownloading ? "bg-outline-variant text-on-surface-variant cursor-not-allowed" : "bg-primary text-on-primary hover:bg-primary-container"
                )}
                disabled={isDownloading}
                onClick={() => handleDownloadReportCard(selectedStudent)}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isDownloading ? "Generating..." : "Download Report Card"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for Drawer */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-scrim/30 backdrop-blur-[2px] z-[90] transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
    </div>
  );
}
