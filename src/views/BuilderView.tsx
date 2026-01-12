import React, { useState } from 'react';
import {
  PlusCircle,
  Upload,
  Download,
  Trash2,
  Sparkles,
  Tag,
  Pencil,
  FileText
} from 'lucide-react';
import type { PhraseItem } from '../types';
import { generateId, parseCSV } from '../lib/utils';
import { usePhraseAppContext } from '../context/PhraseContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { FunButton } from '../components/FunButton';
import { AiGeneratorForm } from '../components/builder/AiGeneratorForm';
import { ManualEntryForm } from '../components/builder/ManualEntryForm';
import { CsvEditorModal } from '../components/builder/CsvEditorModal';
import { EditPhraseModal } from '../components/EditPhraseModal';

export function BuilderView() {
  const { phraseList, setPhraseList } = usePhraseAppContext();

  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai'); 
  const [showDeleteInput, setShowDeleteInput] = useState(false);
  const [deleteTagsInput, setDeleteTagsInput] = useState('');

  const [showCsvEditor, setShowCsvEditor] = useState(false);
  const [csvEditorContent, setCsvEditorContent] = useState('');

  const [editingItem, setEditingItem] = useState<PhraseItem | null>(null);
  
  const [generatedItems, setGeneratedItems] = useState<PhraseItem[] | null>(null);

  const handleAiResults = (newItems: PhraseItem[]) => {
      setGeneratedItems(newItems);
  };

  const handleManualAdd = (newItem: PhraseItem) => {
    setPhraseList((prev: PhraseItem[]) => {
        if (prev.some(v => v.id === newItem.id)) {
            alert(`"${newItem.meaning}" is already in your list!`);
            return prev;
        }
        return [...prev, newItem];
    });
  };

  const confirmGeneratedItems = () => {
      if (!generatedItems) return;
      setPhraseList((prev: PhraseItem[]) => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = generatedItems.filter(item => !existingIds.has(item.id));
          if (uniqueNew.length === 0) {
             alert("All generated items were duplicates!");
             return prev;
          }
          return [...prev, ...uniqueNew];
      });
      setGeneratedItems(null);
  };

  const handleSaveEdit = (updatedItem: PhraseItem) => {
      setPhraseList((prev: PhraseItem[]) => prev.map(item => {
          if (item.id === updatedItem.id) {
              return updatedItem;
          }
          return item;
      }));
      setEditingItem(null);
  };

  const processCSVText = (text: string) => {
    const cleanText = text.replace(/^\uFEFF/, '').trim(); 
    if (!cleanText) { alert("파일 내용이 비어있습니다."); return; }
    const rows = parseCSV(cleanText);
    const startIdx = rows.length > 0 && rows[0].some(cell => cell.toLowerCase().includes('meaning')) ? 1 : 0;
    const newItems: PhraseItem[] = [];
    for (let i = startIdx; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue;
      if (!row[0] && !row[1]) continue;
      newItems.push({
        id: generateId(row[0], row[1]),
        meaning: row[0],
        sentence: row[1],
        pronunciation: row[2] || '',
        tags: row[3] ? row[3].split(',').map(t => t.trim()) : []
      });
    }
    if (newItems.length > 0) {
      setPhraseList((prev: PhraseItem[]) => {
         const existingIds = new Set(prev.map(p => p.id));
         const uniqueNew = newItems.filter(item => !existingIds.has(item.id));
         const reallyUnique: PhraseItem[] = [];
         const seenInBatch = new Set();
         for(const item of uniqueNew) {
           if(!seenInBatch.has(item.id)) {
             seenInBatch.add(item.id);
             reallyUnique.push(item);
           }
         }
         if (reallyUnique.length === 0) {
           alert("All imported items were duplicates!");
           return prev;
         }
         alert(`성공! ${reallyUnique.length}개의 새로운 표현이 추가되었습니다.`);
         return [...prev, ...reallyUnique];
      });
    } else {
      alert('데이터를 찾을 수 없습니다.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => { processCSVText(evt.target?.result as string); };
    reader.readAsText(file);
  };

  const prepareCsvContent = () => {
    const header = ['Meaning', 'Sentence', 'Pronunciation', 'Tags'];
    const rows = phraseList.map(v => [
      `"${v.meaning}"`, 
      `"${v.sentence}"`, 
      `"${v.pronunciation || ''}"`, 
      `"${v.tags.join(', ')}"`
    ]);
    return [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const handleEditCsv = () => {
    setCsvEditorContent(prepareCsvContent());
    setShowCsvEditor(true);
  };

  const handleSaveCsvEditor = (newItems: PhraseItem[]) => {
      setPhraseList(newItems);
  };

  const exportCSV = () => {
    const csvContent = "\uFEFF" + prepareCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phrase_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const executeTagDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsToDelete = deleteTagsInput.split(',').map(t => t.trim()).filter(Boolean);
    
    if (tagsToDelete.length === 0) {
      alert("Please enter your least one tag to delete.");
      return;
    }

    if (confirm(`Are you sure you want to delete items containing tags: "${tagsToDelete.join(', ')}"?`)) {
      setPhraseList((prev: PhraseItem[]) => {
        const initialLength = prev.length;
        const filtered = prev.filter(item => !item.tags.some(tag => tagsToDelete.includes(tag)));
        
        if (filtered.length === initialLength) {
            alert(`No items found with tags: "${tagsToDelete.join(', ')}".`);
            return prev;
        }
        
        alert(`Deleted ${initialLength - filtered.length} items.`);
        setShowDeleteInput(false);
        setDeleteTagsInput('');
        return filtered;
      });
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button onClick={() => setActiveTab('ai')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-500' : 'text-gray-500'}`}>
          <Sparkles size={16} /> AI Generator
        </button>
        <button onClick={() => setActiveTab('manual')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}>
          <PlusCircle size={16} /> Manual
        </button>
      </div>

      {generatedItems && (
        <ConfirmationModal 
          items={generatedItems}
          onConfirm={confirmGeneratedItems}
          onCancel={() => setGeneratedItems(null)}
          onUpdate={setGeneratedItems}
        />
      )}

      {activeTab === 'ai' ? (
        <AiGeneratorForm onGenerate={handleAiResults} />
      ) : (
        <ManualEntryForm onAdd={handleManualAdd} />
      )}

      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-dashed border-gray-300 dark:border-gray-600 group">
          <Upload size={32} className="text-gray-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">CSV File Import</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
      
      <div className="flex gap-2">
        <FunButton onClick={exportCSV} fullWidth variant="neutral" className="flex-1 flex items-center justify-center gap-2">
          <Download size={20} /> Download CSV
        </FunButton>
        <FunButton onClick={handleEditCsv} fullWidth variant="neutral" className="flex-1 flex items-center justify-center gap-2">
          <FileText size={20} /> Edit CSV
        </FunButton>
      </div>
      
      <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[500px] overflow-hidden">
        <div className="flex-none p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
          <h3 className="text-sm font-bold text-gray-400 uppercase flex justify-between items-center">
            <span>Stored Items ({phraseList.length})</span>
            <button onClick={() => setShowDeleteInput(!showDeleteInput)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
              <Tag size={12} /> {showDeleteInput ? 'Cancel' : 'Delete by Tag'}
            </button>
          </h3>
          
          {showDeleteInput && (
            <form onSubmit={executeTagDeletion} className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="Enter tags to delete (comma separated)..." 
                className="flex-1 p-2 text-sm rounded border border-red-200 dark:border-red-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                value={deleteTagsInput}
                onChange={(e) => setDeleteTagsInput(e.target.value)}
              />
              <button type="submit" className="px-3 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 whitespace-nowrap">
                Delete Matches
              </button>
            </form>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {phraseList.slice().reverse().map((item) => (
            <div 
                key={item.id} 
                onClick={() => setEditingItem(item)}
                className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div>
                  <p className="font-bold text-sm">{item.meaning}</p>
                  <p className="text-blue-600 dark:text-blue-300 text-sm">{item.sentence}</p>
                  <div className="flex gap-1 mt-1">{item.tags.map(t => <span key={t} className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{t}</span>)}</div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                    className="text-gray-400 hover:text-blue-500 p-1" 
                    type="button"
                >
                    <Pencil size={16} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setPhraseList((prev: PhraseItem[]) => prev.filter(v => v.id !== item.id)); }}
                    className="text-gray-400 hover:text-red-500 p-1" 
                    type="button"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CsvEditorModal 
        isOpen={showCsvEditor} 
        onClose={() => setShowCsvEditor(false)} 
        initialContent={csvEditorContent} 
        onSave={handleSaveCsvEditor} 
      />

      <EditPhraseModal 
        item={editingItem} 
        onSave={handleSaveEdit} 
        onCancel={() => setEditingItem(null)} 
      />
    </div>
  );
}
