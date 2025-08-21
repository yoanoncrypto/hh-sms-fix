import React, { useState } from 'react';
import { Mail, Send, Users, Clock, CheckCircle, Eye } from 'lucide-react';
import { useTemplates } from '../hooks/useTemplates';
import { useUsers } from '../hooks/useUsers';

const EmailManager: React.FC = () => {
  const { templates } = useTemplates();
  const { allUsers: users } = useUsers();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);

  const emailTemplates = templates.filter(t => t.type === 'email');
  const recipientCount = users.filter(u => u.status === 'active' && u.email).length;

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject || '');
      setContent(template.content);
    } else {
      setSubject('');
      setContent('');
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    setSendProgress(0);
    
    // Simulate sending progress
    const interval = setInterval(() => {
      setSendProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSending(false);
          return 100;
        }
        return prev + 8;
      });
    }, 400);
  };

  const estimatedCost = (recipientCount * 0.02).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="mobile-heading font-bold text-gray-900">Email Campaigns</h2>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="mobile-button bg-gray-600 text-white hover:bg-gray-700"
        >
          <Eye className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{previewMode ? 'Edit Mode' : 'Preview'}</span>
          <span className="sm:hidden">{previewMode ? 'Edit' : 'Preview'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Email Composer */}
        <div className="xl:col-span-2 space-y-6">
          {!previewMode ? (
            <div className="mobile-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compose Email</h3>
              
              {/* Template Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="mobile-input"
                >
                  <option value="">Custom Email</option>
                  {emailTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Line */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="mobile-input"
                />
              </div>

              {/* Email Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your email content..."
                  rows={8}
                  className="mobile-input"
                />
              </div>

              {/* Variables */}
              {selectedTemplate && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Available Variables:</h4>
                  <div className="flex flex-wrap gap-2">
                    {emailTemplates.find(t => t.id === selectedTemplate)?.variables.map(variable => (
                      <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipient Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="radio" id="all-email-users" name="email-recipients" className="mr-2" defaultChecked />
                    <label htmlFor="all-email-users" className="text-sm text-gray-700">All Users with Email ({recipientCount.toLocaleString()})</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="selected-email-users" name="email-recipients" className="mr-2" />
                    <label htmlFor="selected-email-users" className="text-sm text-gray-700">Selected Users Only</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="filter-email-users" name="email-recipients" className="mr-2" />
                    <label htmlFor="filter-email-users" className="text-sm text-gray-700">Filter by Segment</label>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={isSending || !subject.trim() || !content.trim() || recipientCount === 0}
                className="w-full mobile-button justify-center bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="hidden sm:inline">Sending Email... {sendProgress}%</span>
                    <span className="sm:hidden">Sending... {sendProgress}%</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Send Email to {recipientCount.toLocaleString()} Recipients</span>
                    <span className="sm:hidden">Send ({recipientCount})</span>
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {isSending && (
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${sendProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Email Preview */
            <div className="mobile-card overflow-hidden p-0">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
              </div>
              <div className="p-6">
                {/* Email Header */}
                <div className="mb-6 pb-4 border-b">
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>From:</strong> BulkComm Admin {'<admin@bulkcomm.com>'}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>To:</strong> {'{{'} firstName {'}}'} {'{{'} lastName {'}}'} {'<{{email}}>'}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    <strong>Subject:</strong> {subject || 'No subject'}
                  </div>
                </div>
                
                {/* Email Body */}
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800">
                    {content || 'No content'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="mobile-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-600">Recipients</span>
                </div>
                <span className="font-semibold text-gray-900">{recipientCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">Est. Cost</span>
                </div>
                <span className="font-semibold text-gray-900">${estimatedCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-gray-600">Est. Time</span>
                </div>
                <span className="font-semibold text-gray-900">~10 min</span>
              </div>
            </div>
          </div>

          {/* Recent Campaigns */}
          <div className="mobile-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Email Campaigns</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">Newsletter</div>
                  <div className="text-xs text-gray-500">3 hours ago</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">1,456 sent</div>
                  <div className="text-xs text-gray-500">89% opened</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">Product Update</div>
                  <div className="text-xs text-gray-500">2 days ago</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-600">2,134 sent</div>
                  <div className="text-xs text-gray-500">76% opened</div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Guidelines */}
          <div className="mobile-card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Best Practices</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Write compelling subject lines</li>
              <li>• Personalize content with variables</li>
              <li>• Include clear call-to-action</li>
              <li>• Test on different devices</li>
              <li>• Monitor open and click rates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailManager;