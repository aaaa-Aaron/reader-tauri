import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statisticsService } from '../../services/statisticsService';
import type { VocabularyItem, StatisticsSummary } from '../../types/statistics';
import styles from './Statistics.module.css';

const Statistics: React.FC = () => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vocabData, summaryData] = await Promise.all([
        statisticsService.getVocabularyList(),
        statisticsService.getStatisticsSummary()
      ]);
      setVocabulary(vocabData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/library" className={styles.back}>← Back</Link>
        <h1>Statistics</h1>
      </header>

      <main className={styles.main}>
        {summary && (
          <section className={styles.summary}>
            <div className={styles.card}>
              <span className={styles.value}>{summary.totalLookups}</span>
              <span className={styles.label}>Total Lookups</span>
            </div>
            <div className={styles.card}>
              <span className={styles.value}>{summary.uniqueWords}</span>
              <span className={styles.label}>Unique Words</span>
            </div>
            <div className={styles.card}>
              <span className={styles.value}>{summary.mostLookedUpWord || '-'}</span>
              <span className={styles.label}>Most Looked Up</span>
            </div>
            <div className={styles.card}>
              <span className={styles.value}>{summary.averageLookupsPerWord.toFixed(1)}</span>
              <span className={styles.label}>Avg Lookups</span>
            </div>
          </section>
        )}

        <section className={styles.vocabulary}>
          <h2>Vocabulary</h2>
          {vocabulary.length === 0 ? (
            <p className={styles.empty}>No vocabulary yet</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Word</th>
                  <th>Lookups</th>
                  <th>Last Lookup</th>
                </tr>
              </thead>
              <tbody>
                {vocabulary.map(item => (
                  <tr key={item.id}>
                    <td>{item.word}</td>
                    <td>{item.lookupCount}</td>
                    <td>{new Date(item.lastLookupTime).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default Statistics;
