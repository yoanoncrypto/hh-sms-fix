import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageTemplate } from '../types';

export const useTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTemplates: MessageTemplate[] = (data || []).map(template => ({
        id: template.id,
        name: template.name,
        type: template.type,
        subject: template.subject || undefined,
        content: template.content,
        variables: template.variables || [],
      }));

      setTemplates(formattedTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
  };
};