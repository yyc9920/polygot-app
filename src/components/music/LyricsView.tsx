import { useState } from 'react';
import { Sparkles, Loader2, Edit2, Save, X, Check, Plus } from 'lucide-react';
import { useMusicContext } from '../../context/MusicContext';
import { usePhraseAppContext } from '../../context/PhraseContext';
import { FunButton } from '../FunButton';
import { FlipListItem } from '../FlipListItem';
import { useTTS } from '../../hooks/useTTS';
import useLanguage from '../../hooks/useLanguage';
import { useToast } from '../../context/ToastContext';
import type { PhraseEntity } from '../../types/schema';
import type { SongMaterials } from '../../types';
import { generatePhraseFromLyric } from '../../lib/gemini';
import { createPhraseEntity, detectLanguage, generateId } from '../../lib/utils';

import type { MusicContextType } from '../../context/MusicContextDefinition';

interface LyricsViewProps {
  onMaterialsUpdate: (materials: SongMaterials) => void;
  contextOverrides?: Partial<MusicContextType>;
}

export function LyricsView({ onMaterialsUpdate, contextOverrides }: LyricsViewProps) {
   const globalContext = useMusicContext();
   const { musicState, setMusicState, setPlaylist } = contextOverrides ? { ...globalContext, ...contextOverrides } : globalContext;
   const { materials, activeTab, selectedVideo, isLoading } = musicState;
   const { apiKey, phraseList, setPhraseList } = usePhraseAppContext();
   const { t, language, LANGUAGE_NAMES } = useLanguage();
   const { speak } = useTTS();
   const toast = useToast();

  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editForm, setEditForm] = useState({ original: '', translated: '' });

  const isSaved = (meaning: string, sentence: string) => {
    const id = generateId(meaning, sentence);
    return phraseList.some(v => v.id === id);
  };

  const updateState = (updates: Partial<typeof musicState>) => {
    setMusicState(prev => ({ ...prev, ...updates }));
  };

  const handleEditLyricsStart = () => {
    if (!materials) return;
    const originalText = materials.lyrics.map(l => l.original).join('\n');
    const translatedText = materials.lyrics.map(l => l.translated).join('\n');
    setEditForm({ original: originalText, translated: translatedText });
    setIsEditingLyrics(true);
  };

  const handleSaveLyrics = () => {
    if (!materials || !selectedVideo) return;
    
    const originals = editForm.original.split('\n').map(s => s.trim()).filter(s => s);
    const translations = editForm.translated.split('\n').map(s => s.trim());
    
    const newLyrics = originals.map((line, i) => ({
        original: line,
        translated: translations[i] || '',
        isGenerated: false
    }));

    const newMaterials: SongMaterials = {
        ...materials,
        lyrics: newLyrics
    };

    onMaterialsUpdate(newMaterials);
    
    if (newLyrics.length > 0) {
        const newLang = detectLanguage(newLyrics[0].original);
        setPlaylist(prev => prev.map(item => 
            item.id === selectedVideo.videoId ? { ...item, language: newLang } : item
        ));
    }

    setIsEditingLyrics(false);
  };

  const handleGenerateCard = async (line: string, translated: string, index: number) => {
    if (!apiKey || !selectedVideo || !materials) return;
    setGeneratingIdx(index);
    try {
       const targetLanguageName = LANGUAGE_NAMES[language];
       const phraseData = await generatePhraseFromLyric(line, translated, selectedVideo.artist, selectedVideo.title, apiKey, targetLanguageName);
       
       if (phraseData && phraseData.meaning && phraseData.sentence) {
           const newPhrase = {
               meaning: phraseData.meaning,
               sentence: phraseData.sentence,
               pronunciation: phraseData.pronunciation || ''
           };
           
           const updatedLyrics = [...materials.lyrics];
           updatedLyrics[index] = { ...updatedLyrics[index], isGenerated: true };

           const updatedMaterials = {
               ...materials,
               lyrics: updatedLyrics,
               phrases: [...(materials.phrases || []), newPhrase]
           };
           
           onMaterialsUpdate(updatedMaterials);
       }
     } catch (err) {
        const error = err as Error;
        toast.error(t('music.failedGeneratePhrase').replace('{{error}}', error.message));
     } finally {
       setGeneratingIdx(null);
    }
  };

  const handleSavePhrase = (item: { meaning: string; sentence: string; pronunciation: string }) => {
    if (!selectedVideo) return;

    const newItem = createPhraseEntity({
        meaning: item.meaning,
        sentence: item.sentence,
        pronunciation: item.pronunciation,
        tags: ['music', 'generated'],
        memo: `From song: ${selectedVideo.title} by ${selectedVideo.artist}`,
        song: {
            videoId: selectedVideo.videoId,
            title: selectedVideo.title,
            artist: selectedVideo.artist,
            thumbnailUrl: selectedVideo.thumbnailUrl
        }
    });

    setPhraseList(prev => {
        if (prev.some(v => v.id === newItem.id)) return prev;
        return [...prev, newItem];
    });
  };

  if (isLoading) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={16} className="text-blue-500 animate-pulse" />
            </div>
            </div>
            <p className="animate-pulse font-medium">{t('music.generating')}</p>
        </div>
    );
  }

  if (!materials) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <p>{t('music.selectVideo')}</p>
        </div>
    );
  }

  return (
    <>
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 px-2">
        <button 
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'lyrics' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            onClick={() => updateState({ activeTab: 'lyrics' })}
        >
            {t('music.lyricsTab')}
        </button>
        <button 
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'phrase' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            onClick={() => updateState({ activeTab: 'phrase' })}
        >
            {t('music.phrasesTab')} <span className="ml-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full text-xs">{materials.phrases?.length || 0}</span>
        </button>
    </div>

    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar h-full flex flex-col min-h-0">
        {activeTab === 'lyrics' && (
            <div className="space-y-6 pb-32 flex-1 flex flex-col min-h-0">
                {isEditingLyrics ? (
                    <div className="space-y-4 p-2 h-full flex flex-col min-h-0">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-600 dark:text-blue-300 flex items-start gap-2 flex-shrink-0">
                            <Sparkles size={16} className="mt-0.5 flex-shrink-0" />
                            <p>{t('music.editLyricsGuide') || "Edit the lyrics below. Paste the original lyrics on the left and translation on the right. Lines should match."}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
                            <div className="flex flex-col gap-2 h-full min-h-0">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('music.original')}</label>
                                <textarea 
                                    className="flex-1 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-y-auto"
                                    value={editForm.original}
                                    onChange={e => setEditForm(prev => ({ ...prev, original: e.target.value }))}
                                    placeholder={t('music.pasteOriginal')}
                                />
                            </div>
                            <div className="flex flex-col gap-2 h-full min-h-0">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('music.translation')}</label>
                                <textarea 
                                    className="flex-1 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none overflow-y-auto"
                                    value={editForm.translated}
                                    onChange={e => setEditForm(prev => ({ ...prev, translated: e.target.value }))}
                                    placeholder={t('music.pasteTranslation')}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end flex-shrink-0">
                            <FunButton onClick={() => setIsEditingLyrics(false)} variant="neutral">
                                <X size={16} className="mr-2" /> {t('common.cancel')}
                            </FunButton>
                            <FunButton onClick={handleSaveLyrics} variant="primary">
                                <Save size={16} className="mr-2" /> {t('common.saveChanges')}
                            </FunButton>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end px-2 mb-2">
                            <button 
                                onClick={handleEditLyricsStart}
                                className="text-xs flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                <Edit2 size={12} /> {t('common.edit')} Lyrics
                            </button>
                        </div>
                        {materials.lyrics.map((line, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-xl group transition-colors">
                                <div className="flex-1 space-y-1.5">
                                    <p className="text-lg text-gray-800 dark:text-gray-200 font-medium leading-relaxed">{line.original}</p>
                                    {line.translated && <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{line.translated}</p>}
                                </div>
                                <button 
                                  onClick={() => handleGenerateCard(line.original, line.translated, idx)}
                                  disabled={generatingIdx === idx || line.isGenerated}
                                  className={`p-2 rounded-full transition-all flex-shrink-0 ${
                                      line.isGenerated 
                                        ? 'opacity-100 text-green-500 bg-green-50 dark:bg-green-900/20 cursor-default' 
                                        : 'opacity-0 group-hover:opacity-100 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:scale-110 active:scale-95'
                                  }`}
                                  title={line.isGenerated ? t('music.cardGenerated') : t('music.generateCard')}
                                >
                                  {generatingIdx === idx ? (
                                      <Loader2 size={20} className="animate-spin" />
                                  ) : line.isGenerated ? (
                                      <Check size={20} />
                                  ) : (
                                      <Sparkles size={20} />
                                  )}
                                </button>
                            </div>
                        ))}
                        <div className="flex items-start gap-4 p-3 rounded-xl group transition-colors" />
                        <div className="flex items-start gap-4 p-3 rounded-xl group transition-colors" />
                    </>
                )}
            </div>
        )}

        {activeTab === 'phrase' && (
            <div className="space-y-3 pb-32">
                {materials.phrases?.length > 0 ? materials.phrases.map((phrase, idx) => {
                    const saved = isSaved(phrase.meaning, phrase.sentence);
                    
                    const tempItem: PhraseEntity = {
                        id: `temp-${idx}`,
                        meaning: phrase.meaning,
                        sentence: phrase.sentence,
                        pronunciation: phrase.pronunciation,
                        tags: ['music', 'generated'],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        isDeleted: false,
                    };

                    return (
                        <FlipListItem 
                            key={idx}
                            item={tempItem}
                            index={idx}
                            onSpeak={() => speak(tempItem.sentence)}
                            badges={
                                saved && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-bold">{t('music.savedBadge')}</span>
                            }
                            actions={
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if (!saved) handleSavePhrase(phrase); }}
                                    disabled={saved}
                                    className={`p-3 rounded-full shadow-sm transition-transform active:scale-90 hover:shadow-md ${saved ? 'bg-green-100 text-green-600' : 'bg-white dark:bg-gray-600 text-gray-400 hover:text-blue-500'}`}
                                >
                                    {saved ? <Check size={18} /> : <Plus size={18} />}
                                </button>
                            }
                        />
                    );
                }) : (
                  <div className="text-center text-gray-400 mt-10">
                    <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                    <p>{t('music.clickSparkle')}</p>
                  </div>
                )}
                <div className="flex items-start gap-4 p-3 rounded-xl group transition-colors" />
                <div className="flex items-start gap-4 p-3 rounded-xl group transition-colors" />
            </div>
        )}
    </div>
    </>
  );
}
