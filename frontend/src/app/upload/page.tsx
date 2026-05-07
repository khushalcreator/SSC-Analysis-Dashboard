'use client';

import { useState, useCallback } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Info, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { uploadExcel } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload only .xlsx Excel files');
        setFile(null);
      }
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload only .xlsx Excel files');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const blob = await uploadExcel(file);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'SSC_Report_Analyzed.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError('Failed to process the file. Please ensure it matches the required template.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Upload UI */}
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="text-4xl font-black text-on-surface tracking-tight mb-2">Import Results</h1>
            <p className="text-on-surface-variant text-lg">Upload your raw SSC data to generate the intelligence layer.</p>
          </div>

          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant shadow-sm">
            <div 
              className={cn(
                "relative group border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-500 ease-out",
                isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-outline-variant hover:border-primary/50 bg-surface-variant/10"
              )}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              
              <div className="relative z-10">
                <div className={cn(
                  "w-20 h-20 bg-surface rounded-2xl shadow-lg mx-auto mb-6 flex items-center justify-center transition-transform duration-500",
                  isDragging ? "scale-110 rotate-12" : "group-hover:scale-105"
                )}>
                  <UploadCloud className={cn("h-10 w-10", isDragging ? "text-primary" : "text-outline-variant")} />
                </div>
                
                <h3 className="text-xl font-bold text-on-surface mb-2">Drop your Excel file here</h3>
                <p className="text-on-surface-variant mb-8 max-w-xs mx-auto">Only .xlsx files are supported for expert analysis.</p>
                
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".xlsx"
                  onChange={onFileChange}
                />
                <label 
                  htmlFor="file-upload" 
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-on-primary rounded-xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer active:scale-95"
                >
                  Select File
                  <ArrowRight className="h-4 w-4" />
                </label>
              </div>
            </div>

            {file && (
              <div className="mt-8 p-6 bg-surface border border-outline-variant rounded-3xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center">
                    <FileSpreadsheet className="h-6 w-6 text-on-secondary-container" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{file.name}</p>
                    <p className="text-xs text-outline">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="text-sm font-bold text-error hover:bg-error-container/10 px-4 py-2 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-error-container/20 border border-error/30 rounded-xl flex items-center gap-3 animate-in fade-in">
                <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
                <p className="text-sm font-bold text-error">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-6 p-4 bg-secondary-container/20 border border-secondary/30 rounded-xl flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0" />
                <p className="text-sm font-bold text-secondary">Processing complete. Downloading expert report...</p>
              </div>
            )}

            <div className="mt-10 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!file || isUploading || success}
                className={cn(
                  "px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all",
                  !file || isUploading || success 
                    ? "bg-outline-variant text-on-surface-variant cursor-not-allowed"
                    : "bg-on-surface text-surface hover:bg-on-surface-variant shadow-xl active:scale-95"
                )}
              >
                {isUploading ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  "Initiate Analysis"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Expert Guidelines */}
        <div className="w-full lg:w-80 space-y-8">
          <div className="space-y-6">
            <h4 className="text-xs font-black text-outline uppercase tracking-[0.2em]">Expert Guidelines</h4>
            
            <div className="space-y-4">
              {[
                { icon: ShieldCheck, title: "Data Security", desc: "All files are processed in-memory. We never store raw PII data." },
                { icon: Zap, title: "Real-time Processing", desc: "Advanced Pandas algorithms calculate percentiles and pass-rates instantly." },
                { icon: Info, title: "Required Format", desc: "Ensure columns: Name, HT No, Telugu, Hindi, English, Maths, Science, Social." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-surface-container transition-colors">
                  <div className="mt-1">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h5 className="font-bold text-on-surface text-sm">{item.title}</h5>
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-primary-fixed rounded-3xl text-on-primary-fixed relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <h4 className="font-black text-lg mb-2 relative z-10">Pro Tip</h4>
            <p className="text-sm opacity-90 relative z-10 leading-relaxed">
              For best results, ensure your Excel file contains all 6 core subjects. The system will automatically detect the topper and underperformers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
