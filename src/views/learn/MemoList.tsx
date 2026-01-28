import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, X, Pencil } from 'lucide-react';
import useLanguage from '../../hooks/useLanguage';
import type { PhraseEntity } from '../../types/schema';

interface MemoListProps {
  memoList: PhraseEntity[];
  onClose: () => void;
  onUpdatePhrase: (id: string, updates: Partial<PhraseEntity>) => void;
}

export function MemoList({ memoList, onClose, onUpdatePhrase }: MemoListProps) {
  const { t } = useLanguage();
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState('');

  const startEditing = (id: string, currentText: string) => {
    setEditingMemoId(id);
    setEditBuffer(currentText);
  };

  const saveEdit = (id: string) => {
    onUpdatePhrase(id, { memo: editBuffer });
    setEditingMemoId(null);
    setEditBuffer('');
  };

  const cancelEdit = () => {
    setEditingMemoId(null);
    setEditBuffer('');
  };

  return (
    <div className="absolute inset-0 z-50 bg-white dark:bg-gray-900 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-bold flex items-center gap-2"><BookOpen className="text-blue-500"/> {t('learn.myMemos')}</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {memoList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <BookOpen size={48} className="mb-4 opacity-20"/>
            <p>{t('learn.noSavedMemos')}</p>
            <p className="text-sm">{t('learn.useAiTutor')}</p>
          </div>
        ) : (
          memoList.map(item => (
            <div key={item.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl relative">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1 text-lg">{item.sentence}</h4>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {item.pronunciation && !item.tags.some(t => t.toLowerCase() === 'english' || t === '영어') && (
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">/{item.pronunciation}/</span>
                )}
                {item.tags.map(tag => (
                  <span key={tag} className="text-xs text-blue-500 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded">#{tag}</span>
                ))}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">{t('learn.meaning')} {item.meaning}</p>
              
              {editingMemoId === item.id ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-blue-200 dark:border-blue-900">
                  <textarea 
                    className="w-full h-32 p-2 text-sm text-gray-700 dark:text-gray-200 bg-transparent resize-none focus:outline-none"
                    value={editBuffer}
                    onChange={(e) => setEditBuffer(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={cancelEdit} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">{t('common.cancel')}</button>
                    <button onClick={() => saveEdit(item.id)} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">{t('common.save')}</button>
                  </div>
                </div>
              ) : (
                <div className="relative group/memo">
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-yellow-100 dark:border-gray-700 p-3 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {item.memo || ''}
                    </ReactMarkdown>
                  </div>
                  <button 
                    onClick={() => startEditing(item.id, item.memo || '')}
                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-700 rounded shadow-sm text-gray-400 hover:text-blue-500 opacity-0 group-hover/memo:opacity-100 transition-opacity"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}

              <button 
                onClick={() => onUpdatePhrase(item.id, { memo: undefined })}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
