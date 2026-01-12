import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { FunButton } from '../FunButton';
import { generateId } from '../../lib/utils';
import type { PhraseItem } from '../../types';

interface ManualEntryFormProps {
  onAdd: (item: PhraseItem) => void;
}

export function ManualEntryForm({ onAdd }: ManualEntryFormProps) {
  const [form, setForm] = useState({ meaning: '', sentence: '', pronunciation: '', tags: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meaning || !form.sentence) return;
    
    const newItem: PhraseItem = {
      id: generateId(form.meaning, form.sentence),
      meaning: form.meaning,
      sentence: form.sentence,
      pronunciation: form.pronunciation,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    onAdd(newItem);
    setForm({ meaning: '', sentence: '', pronunciation: '', tags: '' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold mb-4 flex items-center gap-2"><PlusCircle size={20} className="text-blue-500"/> Manual Entry</h3>
      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <input 
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
            placeholder="Meaning (뜻) *" 
            value={form.meaning} 
            onChange={e => setForm({...form, meaning: e.target.value})} 
            required 
        />
        <input 
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
            placeholder="Sentence (문장) *" 
            value={form.sentence} 
            onChange={e => setForm({...form, sentence: e.target.value})} 
            required 
        />
        <input 
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
            placeholder="Pronunciation (발음)" 
            value={form.pronunciation} 
            onChange={e => setForm({...form, pronunciation: e.target.value})} 
        />
        <input 
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
            placeholder="Tags (쉼표로 구분)" 
            value={form.tags} 
            onChange={e => setForm({...form, tags: e.target.value})} 
        />
        <FunButton type="submit" variant="primary">Add Item</FunButton>
      </form>
    </div>
  );
}
