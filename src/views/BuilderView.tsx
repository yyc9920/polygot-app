import React, { useState } from 'react';
import {
  PlusCircle,
  Upload,
  Download,
  Trash2,
  Sparkles,
  Loader2,
  Tag,
  X,
  Save
} from 'lucide-react';
import type { VocabItem } from '../types';
import { callGemini } from '../lib/gemini';
import { generateId, parseCSV } from '../lib/utils';
import { useVocabAppContext } from '../context/VocabContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { FunButton } from '../components/FunButton';

export function BuilderView() {
  const { vocabList, setVocabList, apiKey } = useVocabAppContext();

  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai'); 
  const [form, setForm] = useState({ meaning: '', sentence: '', pronunciation: '', tags: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDeleteInput, setShowDeleteInput] = useState(false);
  const [deleteTagsInput, setDeleteTagsInput] = useState('');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<VocabItem | null>(null);
  const [editForm, setEditForm] = useState({ meaning: '', sentence: '', pronunciation: '', tags: '' });
  
  // Confirmation Modal State
  const [generatedItems, setGeneratedItems] = useState<VocabItem[] | null>(null);

  const startEditing = (item: VocabItem) => {
      setEditingItem(item);
      setEditForm({
          meaning: item.meaning,
          sentence: item.sentence,
          pronunciation: item.pronunciation || '',
          tags: item.tags.join(', ')
      });
  };

  const saveEditing = () => {
      if (!editingItem) return;
      if (!editForm.meaning || !editForm.sentence) {
          alert("Meaning and Sentence are required.");
          return;
      }

      setVocabList((prev: VocabItem[]) => prev.map(item => {
          if (item.id === editingItem.id) {
              return {
                  ...item,
                  meaning: editForm.meaning,
                  sentence: editForm.sentence,
                  pronunciation: editForm.pronunciation,
                  tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
              };
          }
          return item;
      }));
      setEditingItem(null);
  };

  const cancelEditing = () => {
      setEditingItem(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meaning || !form.sentence) return;
    const newItem: VocabItem = {
      id: generateId(form.meaning, form.sentence),
      meaning: form.meaning,
      sentence: form.sentence,
      pronunciation: form.pronunciation,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    setVocabList((prev: VocabItem[]) => {
        if (prev.some(v => v.id === newItem.id)) {
            alert(`"${form.meaning}" is already in your list!`);
            return prev;
        }
        return [...prev, newItem];
    });
    setForm({ meaning: '', sentence: '', pronunciation: '', tags: '' });
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert("Please enter your Gemini API Key in Settings first.");
      return;
    }
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const prompt = `Act like a function that generates a vocabulary list with a given situation or context.
Input: Situation or context: '${aiPrompt}', Number of output data: ${aiCount}.
Output: Corresponding vocabulary or phrases with given format.
Format: CSV in markdown, newline in end of each rows.
Columns: Meaning,Sentence,Pronunciation,Tags
Contents:
Meaning: Native language translation (e.g. Korean)
Sentence: Target language sentence (e.g. Japanese)
Pronunciation: Pronunciation guide (e.g. Romaji)
Tags: Tags in Native language (e.g. "일상,비즈니스"). Can be multiple tags separated by comma. If context implies a specific language, add that as a tag (e.g. "일본어").
    - Tag List(in Native Language):
      1. 일상
      2. 여행
      3. 식사
      4. 비즈니스
      5. IT
      6. 사회
      7. 스포츠
      8. 학습
      9. 감정
Enclose each data point in double quotation marks("").
Example:
"따뜻한 아메리카노 한 잔 주세요","ホットコーヒーを一つください","Hotto kōhī o hitotsu kudasai","카페,주문,일본어"
Make sure that there isn't format error. Return ONLY the CSV content, no introduction or markdown code blocks.`;

      const resultText = await callGemini(prompt, apiKey);
      const csvStr = resultText.replace(/```csv/g, '').replace(/```/g, '').trim();
      const rows = parseCSV(csvStr);
      
      const newItems: VocabItem[] = [];
      for (const row of rows) {
          if (row.length < 2) continue;
          newItems.push({
              id: generateId(row[0], row[1]),
              meaning: row[0],
              sentence: row[1],
              pronunciation: row[2] || '',
              tags: row[3] ? row[3].split(',').map(t => t.trim()) : []
          });
      }

      if (newItems.length > 0) {
         setGeneratedItems(newItems);
         setAiPrompt('');
      } else {
        alert("Failed to parse generated content. Please try again.");
      }
    } catch (err: any) {
      alert(`AI Generation Failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmGeneratedItems = () => {
      if (!generatedItems) return;
      setVocabList((prev: VocabItem[]) => {
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

  const processCSVText = (text: string) => {
    const cleanText = text.replace(/^\uFEFF/, '').trim(); 
    if (!cleanText) { alert("파일 내용이 비어있습니다."); return; }
    const rows = parseCSV(cleanText);
    const startIdx = rows.length > 0 && rows[0].some(cell => cell.toLowerCase().includes('meaning')) ? 1 : 0;
    const newItems: VocabItem[] = [];
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
      setVocabList((prev: VocabItem[]) => {
         const existingIds = new Set(prev.map(p => p.id));
         const uniqueNew = newItems.filter(item => !existingIds.has(item.id));
         const reallyUnique: VocabItem[] = [];
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
         alert(`성공! ${reallyUnique.length}개의 새로운 단어가 추가되었습니다.`);
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

  const exportCSV = () => {
    const header = ['Meaning', 'Sentence', 'Pronunciation', 'Tags'];
    const rows = vocabList.map(v => [
      `"${v.meaning}"`, 
      `"${v.sentence}"`, 
      `"${v.pronunciation || ''}"`, 
      `"${v.tags.join(', ')}"`
    ]);
    const csvContent = "\uFEFF" + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vocab_export_${new Date().toISOString().slice(0,10)}.csv`;
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
      setVocabList((prev: VocabItem[]) => {
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
      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button onClick={() => setActiveTab('ai')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-500' : 'text-gray-500'}`}>
          <Sparkles size={16} /> AI Generator
        </button>
        <button onClick={() => setActiveTab('manual')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-500'}`}>
          <PlusCircle size={16} /> Manual
        </button>
      </div>

      {/* Confirmation Modal */}
      {generatedItems && (
        <ConfirmationModal 
          items={generatedItems}
          onConfirm={confirmGeneratedItems}
          onCancel={() => setGeneratedItems(null)}
          onUpdate={setGeneratedItems}
        />
      )}

      {/* AI Form */}
      {activeTab === 'ai' ? (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4"><Sparkles className="text-blue-500" /><h3 className="font-bold text-lg">AI Phrase/Sentence Generator</h3></div>
          <form onSubmit={handleAiGenerate} className="flex flex-col gap-3">
             <div className="flex gap-2">
               <input className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Travel in Japan" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} required />
               <input type="number" min="1" max="20" value={aiCount} onChange={(e) => setAiCount(parseInt(e.target.value))} className="w-16 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center" />
             </div>
             <FunButton type="submit" disabled={isGenerating} fullWidth variant="primary" className="flex items-center justify-center gap-2">
                {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />} Generate Phrases
             </FunButton>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold mb-4 flex items-center gap-2"><PlusCircle size={20} className="text-blue-500"/> Manual Entry</h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Meaning (뜻) *" value={form.meaning} onChange={e => setForm({...form, meaning: e.target.value})} required />
            <input className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Sentence (문장) *" value={form.sentence} onChange={e => setForm({...form, sentence: e.target.value})} required />
            <input className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Pronunciation (발음)" value={form.pronunciation} onChange={e => setForm({...form, pronunciation: e.target.value})} />
            <input className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Tags (쉼표로 구분)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
            <FunButton type="submit" variant="primary">Add Item</FunButton>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-dashed border-gray-300 dark:border-gray-600 group">
          <Upload size={32} className="text-gray-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">CSV File Import</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
      
      <FunButton onClick={exportCSV} fullWidth variant="neutral" className="flex items-center justify-center gap-2">
        <Download size={20} /> Download CSV (Export)
      </FunButton>
      
      {/* Stored Items List */}
      <div className="flex flex-col flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[500px] overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-none p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
          <h3 className="text-sm font-bold text-gray-400 uppercase flex justify-between items-center">
            <span>Stored Items ({vocabList.length})</span>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {vocabList.slice().reverse().map((item) => (
            <div 
                key={item.id} 
                onClick={() => startEditing(item)}
                className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <div>
                  <p className="font-bold text-sm">{item.meaning}</p>
                  <p className="text-blue-600 dark:text-blue-300 text-sm">{item.sentence}</p>
                  <div className="flex gap-1 mt-1">{item.tags.map(t => <span key={t} className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{t}</span>)}</div>
              </div>
              <button 
                  onClick={(e) => { e.stopPropagation(); setVocabList((prev: VocabItem[]) => prev.filter(v => v.id !== item.id)); }}
                  className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                  type="button"
              >
                  <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-bold text-lg">Edit Item</h3>
                      <button onClick={cancelEditing} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20}/></button>
                  </div>
                  <div className="p-4 flex flex-col gap-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Meaning</label>
                          <input 
                              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" 
                              value={editForm.meaning} 
                              onChange={e => setEditForm({...editForm, meaning: e.target.value})} 
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Sentence</label>
                          <input 
                              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" 
                              value={editForm.sentence} 
                              onChange={e => setEditForm({...editForm, sentence: e.target.value})} 
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Pronunciation</label>
                          <input 
                              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" 
                              value={editForm.pronunciation} 
                              onChange={e => setEditForm({...editForm, pronunciation: e.target.value})} 
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Tags (comma separated)</label>
                          <input 
                              className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" 
                              value={editForm.tags} 
                              onChange={e => setEditForm({...editForm, tags: e.target.value})} 
                          />
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2">
                      <button onClick={cancelEditing} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                      <FunButton onClick={saveEditing} variant="primary" className="flex items-center gap-2">
                          <Save size={16} /> Save Changes
                      </FunButton>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}