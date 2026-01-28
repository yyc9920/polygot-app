import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { FunButton } from '../FunButton';
import { generateId } from '../../lib/utils';
import type { PhraseEntity } from '../../types/schema';
import { createPhraseEntity } from '../../types/schema';
import useLanguage from '../../hooks/useLanguage';

interface ManualEntryFormProps {
  onAdd: (item: PhraseEntity) => void;
}

export function ManualEntryForm({ onAdd }: ManualEntryFormProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ meaning: '', sentence: '', pronunciation: '', tags: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meaning || !form.sentence) return;
    
    const newItem = createPhraseEntity(
      generateId(form.meaning, form.sentence),
      form.meaning,
      form.sentence,
      form.tags.split(',').map(t => t.trim()).filter(Boolean),
      { pronunciation: form.pronunciation }
    );
    
    onAdd(newItem);
    setForm({ meaning: '', sentence: '', pronunciation: '', tags: '' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold mb-4 flex items-center gap-2"><PlusCircle size={20} className="text-blue-500"/> {t('builder.manualEntry')}</h3>
      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <input 
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
            placeholder={t('builder.meaningLabel')} 
            value={form.meaning} 
            onChange={e => setForm({...form, meaning: e.target.value})} 
            required 
        />
        <input 
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
            placeholder={t('builder.sentenceLabel')} 
            value={form.sentence} 
            onChange={e => setForm({...form, sentence: e.target.value})} 
            required 
        />
        <input 
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
            placeholder={t('builder.pronunciationLabel')} 
            value={form.pronunciation} 
            onChange={e => setForm({...form, pronunciation: e.target.value})} 
        />
        <input 
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
            placeholder={t('builder.tagsLabel') + ' (' + t('builder.tagsPlaceholder') + ')'} 
            value={form.tags} 
            onChange={e => setForm({...form, tags: e.target.value})} 
        />
        <FunButton type="submit" variant="primary">{t('builder.addItem')}</FunButton>
      </form>
    </div>
  );
}
