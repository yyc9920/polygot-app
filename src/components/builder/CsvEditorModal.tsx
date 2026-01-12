import { useState, useEffect } from 'react';
import { FileText, X, Save } from 'lucide-react';
import { FunButton } from '../FunButton';
import { parseCSV, generateId } from '../../lib/utils';
import type { PhraseItem } from '../../types';

interface CsvEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (items: PhraseItem[]) => void;
}

export function CsvEditorModal({ isOpen, onClose, initialContent, onSave }: CsvEditorModalProps) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  const handleSave = () => {
    const cleanText = content.replace(/^\uFEFF/, '').trim();
    if (!cleanText) {
        if(confirm("Content is empty. This will clear your list. Continue?")) {
            onSave([]);
            onClose();
        }
        return;
    }

    try {
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
            tags: row[3] ? row[3].split(',').map(t => t.trim()).filter(Boolean) : []
          });
        }
        
        if (newItems.length === 0 && !confirm("No valid items found. Clear list?")) {
            return;
        }

        onSave(newItems);
        onClose();
        alert(`Saved ${newItems.length} items.`);
    } catch (e) {
        alert("Error parsing CSV. Please check formatting.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-lg flex items-center gap-2"><FileText size={20} /> Edit CSV Content</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20}/></button>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-2 min-h-0">
           <div className="text-xs text-gray-500 mb-1">
             Format: "Meaning","Sentence","Pronunciation","Tags" (Header is optional but recommended)
           </div>
           <textarea 
              className="flex-1 w-full p-4 font-mono text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
           />
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2">
           <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
           <FunButton onClick={handleSave} variant="primary" className="flex items-center gap-2">
             <Save size={16} /> Update List
           </FunButton>
        </div>
      </div>
    </div>
  );
}
