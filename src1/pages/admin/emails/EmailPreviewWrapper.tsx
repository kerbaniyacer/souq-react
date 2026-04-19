import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function EmailPreviewWrapper({ title, children }: Props) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/admin/emails')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 font-arabic transition-colors">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <Mail className="w-4 h-4 text-primary-500" />
        <span className="text-sm font-medium text-gray-700 font-arabic">{title}</span>
        <span className="mr-auto text-xs text-gray-400 font-arabic bg-gray-100 px-2 py-1 rounded-full">معاينة قالب البريد</span>
      </div>

      {/* Email preview frame */}
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Fake email client header */}
          <div className="bg-white rounded-t-2xl border border-gray-200 border-b-0 px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-gray-400 font-arabic w-12">من:</span>
              <span className="text-xs text-gray-600">noreply@souq.dz</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-gray-400 font-arabic w-12">إلى:</span>
              <span className="text-xs text-gray-600">user@example.com</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-arabic w-12">الموضوع:</span>
              <span className="text-xs font-medium text-gray-800 font-arabic">{title}</span>
            </div>
          </div>

          {/* Email body */}
          <div className="border border-gray-200 rounded-b-2xl overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
