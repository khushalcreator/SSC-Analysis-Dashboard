'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchAllStudents, downloadReportCard, downloadBatchReports } from '@/lib/api';
import { 
  Search, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  User, 
  Calendar, 
  Home, 
  Hash,
  AlertCircle,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
  [key: string]: any;
}

export default function ReportCardGeneratorPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('2023 - 2024 (Current)');
  const [selectedClassSection, setSelectedClassSection] = useState('Class 10 - Section A');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAllStudents();
      setStudents(data);
      if (data.length > 0) setSelectedStudent(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s['Hall Ticket No'].toString().includes(searchQuery);
      
      const matchesClass = selectedClassSection.includes(s.Class) && selectedClassSection.includes(s.Section);
      
      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, selectedClassSection]);

  const handleDownload = async () => {
    if (!selectedStudent) return;
    try {
      setIsDownloading(true);
      const blob = await downloadReportCard(selectedStudent['Hall Ticket No']);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_Card_${selectedStudent['Hall Ticket No']}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to generate report card.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBatchDownload = async () => {
    if (!selectedStudent) return;
    try {
      setIsBatchDownloading(true);
      const { Class, Section } = selectedStudent;
      const blob = await downloadBatchReports(Class, Section);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Batch_Reports_Class_${Class}_Section_${Section}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to generate batch reports.");
    } finally {
      setIsBatchDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium">Initializing Generation Engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-black uppercase tracking-widest rounded-full">
              Transcript Engine
            </div>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">SSC Class 10 Report Card Generator</h1>
          <p className="text-on-surface-variant text-lg">Generate, preview, and export official academic transcripts for the current session.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            className="px-6 py-3 bg-[#e5eeff] text-primary rounded-xl font-bold flex items-center gap-2 hover:bg-primary/10 transition-all border border-primary/10"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print Quick View
          </button>
          <button 
            className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 hover:shadow-lg active:scale-95 transition-all"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Student Selection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-outline-variant shadow-sm space-y-6">
            <h3 className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
              <User className="h-4 w-4" /> Select Student
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-outline uppercase tracking-widest">Academic Year</label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-bold focus:outline-none focus:border-primary appearance-none transition-all"
                >
                  <option>2023 - 2024 (Current)</option>
                  <option>2022 - 2023</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-outline uppercase tracking-widest">Class / Section</label>
                <select 
                  value={selectedClassSection}
                  onChange={(e) => setSelectedClassSection(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-bold focus:outline-none focus:border-primary appearance-none transition-all"
                >
                  {Array.from(new Set(students.map(s => `${s.Class} - Section ${s.Section}`)))
                    .sort()
                    .map(cs => (
                      <option key={cs} value={cs}>{cs}</option>
                    ))
                  }
                  {students.length === 0 && <option>No data available</option>}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-outline uppercase tracking-widest">Student Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search name..." 
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm font-bold focus:outline-none focus:border-primary transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                </div>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {filteredStudents.map((s) => (
                <button
                  key={s['Hall Ticket No']}
                  onClick={() => setSelectedStudent(s)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left",
                    selectedStudent?.['Hall Ticket No'] === s['Hall Ticket No']
                      ? "bg-primary/5 border-primary/20 text-primary"
                      : "bg-surface border-outline-variant/30 text-on-surface hover:bg-surface-variant/50"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs">
                    {s.Name[0]}
                  </div>
                  <span className="font-bold text-sm truncate">{s.Name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Batch Generation Card */}
          {selectedStudent && (
            <div className="bg-primary rounded-3xl p-8 border border-primary/20 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <FileText className="h-24 w-24 text-on-primary" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-on-primary/10 rounded-xl flex items-center justify-center text-on-primary">
                    <Printer className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black text-on-primary tracking-tight">Batch Generation</h3>
                </div>
                
                <p className="text-on-primary/80 text-sm leading-relaxed font-medium">
                  Generate reports for the entire <span className="text-on-primary font-black">Class {selectedStudent.Class} - Section {selectedStudent.Section}</span> 
                  ({students.filter(st => st.Class === selectedStudent.Class && st.Section === selectedStudent.Section).length} students).
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-on-primary/60">
                    <span>System Readiness</span>
                    <span>98% Verified</span>
                  </div>
                  <div className="h-2 bg-on-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-on-primary w-[98%] rounded-full" />
                  </div>
                </div>

                <button 
                  onClick={handleBatchDownload}
                  disabled={isBatchDownloading}
                  className="w-full py-4 bg-white text-primary rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isBatchDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  {isBatchDownloading ? "Processing..." : "Start Batch Export"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content: Preview */}
        <div className="lg:col-span-8 space-y-8 relative">
          {selectedStudent ? (
            <div className="bg-white rounded-3xl border border-outline-variant shadow-2xl overflow-hidden">
              {/* Report Header */}
              <div className="p-8 flex items-start gap-8">
                <div className="w-28 h-28 rounded-2xl bg-surface-container overflow-hidden border border-outline-variant">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.Name}`} alt="Profile" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-on-surface tracking-tight">{selectedStudent.Name}</h2>
                    <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-black uppercase tracking-widest rounded-md">Honor Roll</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest">Hall Ticket No</p>
                      <p className="text-sm font-bold text-on-surface">{selectedStudent['Hall Ticket No']}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest">Class</p>
                      <p className="text-sm font-bold text-on-surface">{selectedStudent.Class} - {selectedStudent.Section}</p>
                    </div>
                  </div>
                </div>

                <div className="w-40 bg-[#e5eeff] rounded-2xl p-4 border border-primary/10 text-center">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Total Marks</p>
                  <p className="text-4xl font-black text-primary leading-none">{selectedStudent.Total}</p>
                  <p className="text-[9px] font-bold text-primary/60 uppercase mt-2">Percentage: {selectedStudent.Percentage}%</p>
                </div>
              </div>

              {/* Marks Table */}
              <div className="px-8 pb-8">
                <div className="rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-surface-container-low">
                      <tr className="border-b border-outline-variant">
                        <th className="px-6 py-4 text-left font-black text-outline uppercase tracking-widest text-[9px]">Subject</th>
                        <th className="px-6 py-4 text-center font-black text-outline uppercase tracking-widest text-[9px]">Theory</th>
                        <th className="px-6 py-4 text-center font-black text-outline uppercase tracking-widest text-[9px]">Practical</th>
                        <th className="px-6 py-4 text-center font-black text-outline uppercase tracking-widest text-[9px]">Total</th>
                        <th className="px-6 py-4 text-right font-black text-outline uppercase tracking-widest text-[9px]">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {['I LANG', 'ENGLISH', 'MATHS', 'SCIENCE', 'SOCIAL', 'II LANG'].map((sub) => {
                        const total = selectedStudent[sub];
                        const theory = Math.floor(total * 0.8);
                        const practical = total - theory;
                        return (
                          <tr key={sub} className="hover:bg-surface-variant/10 transition-colors">
                            <td className="px-6 py-4 font-bold text-on-surface">{sub}</td>
                            <td className="px-6 py-4 text-center font-medium text-outline">{theory}/80</td>
                            <td className="px-6 py-4 text-center font-medium text-outline">{practical}/20</td>
                            <td className="px-6 py-4 text-center font-black text-primary">{total}/100</td>
                            <td className="px-6 py-4 text-right">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-black",
                                total >= 90 ? "bg-secondary-container text-on-secondary-container" : total >= 35 ? "bg-primary/10 text-primary" : "bg-error-container text-on-error-container"
                              )}>
                                {total >= 90 ? 'A+' : total >= 80 ? 'A' : total >= 35 ? 'B+' : 'F'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Remarks Section */}
                <div className="mt-8 space-y-4">
                  <h4 className="text-[10px] font-black text-outline uppercase tracking-widest">Teacher's Remarks</h4>
                  <p className="text-sm font-medium text-on-surface-variant leading-relaxed italic border-l-4 border-primary/20 pl-4 py-1">
                    "{remarks || `${selectedStudent.Name} has shown exceptional performance this session, particularly in technical subjects. Continuous focus on creative presentation will further enhance overall results.`}"
                  </p>
                  
                  <div className="flex justify-end pt-4">
                    <div className="text-right">
                      <div className="h-10 w-32 border-b border-on-surface/20 mb-1" />
                      <p className="text-[9px] font-black text-outline uppercase tracking-widest">Class Teacher's Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-surface-container-low rounded-[32px] border border-dashed border-outline-variant">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-on-surface">No Student Selected</h3>
              <p className="text-on-surface-variant mt-2 max-w-sm">Select a student from the sidebar to begin.</p>
            </div>
          )}

          {/* FAB */}
          <button className="fixed bottom-10 right-10 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
            <Plus className="h-6 w-6 font-bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Missing icon from lucide-react in previous import
function GraduationCap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
