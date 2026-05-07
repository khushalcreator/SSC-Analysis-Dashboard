import { redirect } from 'next/navigation';

export default function AnalysisPage() {
  // Redirect root /analysis to the class analysis page
  redirect('/analysis/class');
}
