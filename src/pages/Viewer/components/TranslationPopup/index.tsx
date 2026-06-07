import React, { useState, useEffect } from 'react';
import { DataSourceType } from '../../../../types/translation';
import type { TranslationResult, TranslationRequest } from '../../../../types/translation';
import { translationService } from '../../../../services/translationService';
import styles from '../../Viewer.module.css';

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
          originalText: selectedWord,
          dataSource: DataSourceType.API,
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
    <div className={styles.translatePopup} id="translate-popup" style={{ display: selectedWord ? 'block' : 'none' }}>
      <div className={styles.translateHeader}>
        <span>翻译结果</span>
        <button className={styles.closeTranslate} onClick={onClose}>
          ×
        </button>
      </div>
      <div className={styles.translateContent} id="translate-content">
        {selectedWord && (
          <div><strong>原文：</strong>{selectedWord}</div>
        )}
        {isTranslating ? (
          <div><strong>翻译：</strong>翻译中...</div>
        ) : translationResult ? (
          <>
            {translationResult.success ? (
              <>
                {translationResult.dataSource === DataSourceType.DICTIONARY ? (
                  translationResult.dictionaryResult && translationResult.dictionaryResult.definition ? (
                    <div className="entry" dangerouslySetInnerHTML={{ __html: translationResult.dictionaryResult.definition }} />
                  ) : (
                    <div><strong>翻译：</strong>词典查询失败</div>
                  )
                ) : translationResult.dataSource === DataSourceType.API && translationResult.apiResult ? (
                  <>
                    <div><strong>翻译：</strong>{translationResult.apiResult.translated}</div>
                    {translationResult.apiResult.phonetic && (
                      <div><strong>音标：</strong>{translationResult.apiResult.phonetic}</div>
                    )}
                    {translationResult.apiResult.explains && translationResult.apiResult.explains.length > 0 && (
                      <div>
                        <strong>解释：</strong>
                        <ul>
                          {translationResult.apiResult.explains.map((explain, index) => (
                            <li key={index}>{explain}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div><strong>源语言：</strong>{translationResult.apiResult.source}</div>
                    <div><strong>目标语言：</strong>{translationResult.apiResult.target}</div>
                  </>
                ) : (
                  <div><strong>翻译：</strong>翻译失败</div>
                )}
              </>
            ) : (
              <div><strong>错误：</strong>翻译失败</div>
            )}
          </>
        ) : (
          <div><strong>翻译：</strong>等待翻译结果...</div>
        )}
      </div>
    </div>
  );
};

export default TranslationPopup;
