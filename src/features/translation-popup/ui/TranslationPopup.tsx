import React, { useState, useEffect } from 'react';
import { translationService } from '../../../entities/translation';
import type { TranslationResult } from '../../../entities/translation';
import styles from './TranslationPopup.module.css';

enum DataSourceType {
  DICTIONARY = 'dictionary',
  API = 'api'
}

interface TranslationRequest {
  text: string;
  from?: string;
  to?: string;
  bookId?: number;
  context?: string;
}

interface TranslationPopupProps {
  selectedWord: string;
  context?: string;
  bookId?: number;
  onClose: () => void;
  onTranslatingChange?: (isTranslating: boolean) => void;
}

const TranslationPopup: React.FC<TranslationPopupProps> = ({
  selectedWord,
  context,
  bookId,
  onClose,
  onTranslatingChange
}) => {
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedWord || selectedWord.trim().length === 0) {
      setTranslationResult(null);
      setIsTranslating(false);
      onTranslatingChange?.(false);
      return;
    }

    setIsTranslating(true);
    onTranslatingChange?.(true);

    const fetchTranslation = async () => {
      try {
        const request: TranslationRequest = {
          text: selectedWord,
          from: 'auto',
          to: 'zh-CHS',
          bookId: bookId,
          context: context
        };

        const result = await translationService.translate(request);
        setTranslationResult(result);
      } catch (error) {
        console.error('翻译失败:', error);
        setTranslationResult({
          word: selectedWord,
          original_text: selectedWord,
          data_source: DataSourceType.API,
          success: false,
        });
      } finally {
        setIsTranslating(false);
        onTranslatingChange?.(false);
      }
    };

    fetchTranslation();
  }, [selectedWord, bookId, onTranslatingChange]);

  return (
    <div className={`${styles.popup} ${selectedWord ? styles.visible : ''}`} id="translate-popup">
      <button className={styles.closeBtn} onClick={onClose}>
        ×
      </button>
      <div className={styles.content} id="translate-content">
        {isTranslating ? (
          <div className={styles.loading}>翻译中...</div>
        ) : translationResult ? (
          <>
            {translationResult.success ? (
              <>
                {translationResult.data_source === DataSourceType.DICTIONARY ? (
                  translationResult.dictionary_result && translationResult.dictionary_result.definition ? (
                    <div className="entry" dangerouslySetInnerHTML={{ __html: translationResult.dictionary_result.definition }} />
                  ) : (
                    <div className={styles.error}>词典查询失败</div>
                  )
                ) : translationResult.data_source === DataSourceType.API && translationResult.api_result ? (
                  <>
                    <div className={styles.translation}>{translationResult.api_result.translated}</div>
                    {translationResult.api_result.phonetic && (
                      <div className={styles.phonetic}>{translationResult.api_result.phonetic}</div>
                    )}
                    {translationResult.api_result.explains && translationResult.api_result.explains.length > 0 && (
                      <div className={styles.explains}>
                        {translationResult.api_result.explains.map((explain, index) => (
                          <div key={index} className={styles.explain}>{index + 1}. {explain}</div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.error}>翻译失败</div>
                )}
              </>
            ) : (
              <div className={styles.error}>翻译失败</div>
            )}
          </>
        ) : (
          <div className={styles.loading}>等待翻译结果...</div>
        )}
      </div>
    </div>
  );
};

export default TranslationPopup;