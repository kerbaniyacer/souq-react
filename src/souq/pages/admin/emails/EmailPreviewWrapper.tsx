import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Settings2, X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DEFAULT_EMAIL_CONTENT, type EmailContent } from '@souq/data/emailTemplatesConfig';

interface Props {
  title: string;
  type?: string;
  children: React.ReactNode;
}

export default function EmailPreviewWrapper({ title, type, children }: Props) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<EmailContent | null>(null);

  useEffect(() => {
    if (type) {
      const saved = localStorage.getItem(`email_temp_${type}`);
      if (saved) {
        setContent(JSON.parse(saved));
      } else {
        setContent(DEFAULT_EMAIL_CONTENT[type] || null);
      }
    }
  }, [type]);

  const handleSave = () => {
    if (type && content) {
      localStorage.setItem(`email_temp_${type}`, JSON.stringify(content));
      setIsEditing(false);
      window.location.reload(); // Refresh to see changes in child components
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex overflow-hidden">
      {/* Editor Sidebar */}
      {isEditing && content && (
        <div className="w-80 bg-white border-left border-gray-200 h-screen overflow-y-auto flex-shrink-0 z-20 shadow-xl animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="font-bold text-gray-800 font-arabic">تعديل القالب</h3>
            <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-arabic text-gray-400 mb-1.5">عنوان الرسالة (Subject):</label>
              <input value={content.subject} onChange={e => setContent({...content, subject: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm font-arabic focus:ring-2 focus:ring-primary-400/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-arabic text-gray-400 mb-1.5">العنوان الرئيسي (Header):</label>
              <input value={content.header} onChange={e => setContent({...content, header: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm font-arabic focus:ring-2 focus:ring-primary-400/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-arabic text-gray-400 mb-1.5">العنوان الفرعي (Subheader):</label>
              <textarea value={content.subheader} onChange={e => setContent({...content, subheader: e.target.value})} rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm font-arabic focus:ring-2 focus:ring-primary-400/20 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-arabic text-gray-400 mb-1.5">نص المحتوى (Body):</label>
              <textarea value={content.bodyText} onChange={e => setContent({...content, bodyText: e.target.value})} rows={5}
                className="w-full px-3 py-2 border rounded-lg text-sm font-arabic focus:ring-2 focus:ring-primary-400/20 outline-none resize-none" />
            </div>
            {content.buttonLabel !== undefined && (
              <>
                <div>
                  <label className="block text-xs font-arabic text-gray-400 mb-1.5">نص الزر:</label>
                  <input value={content.buttonLabel} onChange={e => setContent({...content, buttonLabel: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-arabic focus:ring-2 focus:ring-primary-400/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-arabic text-gray-400 mb-1.5">رابط الزر:</label>
                  <input value={content.buttonLink} onChange={e => setContent({...content, buttonLink: e.target.value})} dir="ltr"
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-400/20 outline-none" />
                </div>
              </>
            )}
            <button onClick={handleSave} className="w-full py-3 bg-primary-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 mt-4">
              <Save className="w-4 h-4" />
              حفظ التعديلات
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shrink-0">
          <button onClick={() => navigate('/admin/emails')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 font-arabic transition-colors">
            <ArrowRight className="w-4 h-4" />
            رجوع
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <Mail className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-medium text-gray-700 font-arabic">{title}</span>
          <span className="mr-auto text-xs text-gray-400 font-arabic bg-gray-100 px-2 py-1 rounded-full">معاينة قالب البريد</span>
          
          {type && (
            <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-arabic transition-all ${isEditing ? 'bg-primary-50 text-primary-600 font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Settings2 className="w-4 h-4" />
              تعديل القالب
            </button>
          )}
        </div>

        {/* Email preview frame */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-8 px-4">
            <div className="max-w-2xl mx-auto shadow-2xl rounded-2xl overflow-hidden mb-10">
              {/* Fake email client header */}
              <div className="bg-white px-8 py-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-gray-400 font-arabic w-16">من:</span>
                  <span className="text-sm text-gray-700 font-medium tracking-tight">Souq Marketplace <span className="text-gray-400 font-normal">{"<"}noreply@souq.dz{">"}</span></span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-gray-400 font-arabic w-16">إلى:</span>
                  <span className="text-sm text-gray-600">user@example.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-arabic w-16">الموضوع:</span>
                  <span className="text-sm font-bold text-gray-900 font-arabic">{content?.subject || title}</span>
                </div>
              </div>

              {/* Email body */}
              <div className="bg-white">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
