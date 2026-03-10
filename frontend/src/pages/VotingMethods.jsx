import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './VotingMethods.css';

const VotingMethods = () => {
  const [activeMethod, setActiveMethod] = useState(null);
  const { t, translations } = useLanguage();
  const vm = translations.votingMethods;

  return (
    <div className="container voting-methods-page">
      <div className="page-card">
        <h1>{t('votingMethods.title')}</h1>
        <p className="page-subtitle">
          {t('votingMethods.subtitle')}
        </p>

        <div className="methods-grid">
          {vm.methods.map(method => (
            <div
              key={method.id}
              className={`method-card ${activeMethod === method.id ? 'expanded' : ''}`}
              style={{ borderTop: `4px solid ${method.color}` }}
            >
              <div
                className="method-card-header"
                onClick={() => setActiveMethod(activeMethod === method.id ? null : method.id)}
              >
                <div className="method-icon">{method.icon}</div>
                <div className="method-title-block">
                  <h2 className="method-name">{method.name}</h2>
                  <p className="method-short">{method.shortDesc}</p>
                </div>
                <div className="method-toggle">{activeMethod === method.id ? '▲' : '▼'}</div>
              </div>

              {activeMethod === method.id && (
                <div className="method-body">
                  {method.sections.map(section => (
                    <div key={section.title} className="method-section">
                      <h3>{section.title}</h3>
                      <p style={{ whiteSpace: 'pre-line' }}>{section.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="example-section">
          <h2>{t('votingMethods.exampleTitle')}</h2>
          <div className="example-scenario">
            <p>{t('votingMethods.exampleScenario')}</p>
          </div>

          <div className="example-votes">
            <h3>{t('votingMethods.exampleVotersTitle')}</h3>
            <div className="votes-table">
              {vm.voters.map((v, i) => (
                <div key={i} className="votes-row">
                  <span className="votes-count">{v.label}</span>
                  <span className="votes-ranking">
                    {v.ranking.map((r, idx) => (
                      <span key={idx} className="rank-item">
                        <span className="rank-num">{idx + 1}</span>{r}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="example-results">
            <h3>{t('votingMethods.exampleResultsTitle')}</h3>
            <div className="results-grid">
              {vm.methods.map(method => {
                const result = vm.exampleResults[method.id];
                return (
                  <div key={method.id} className="result-card" style={{ borderLeft: `4px solid ${method.color}` }}>
                    <div className="result-header">
                      <span>{method.icon}</span>
                      <strong>{method.name.split('(')[0].trim()}</strong>
                    </div>
                    <div className="result-winner">
                      🏆 <strong>{result.winner}</strong>
                    </div>
                    <p className="result-explanation" style={{ whiteSpace: 'pre-line' }}>
                      {result.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="example-takeaway">
            <h3>{t('votingMethods.exampleTakeawayTitle')}</h3>
            <p dangerouslySetInnerHTML={{ __html: t('votingMethods.exampleTakeaway1') }} />
            <p style={{ marginTop: '10px' }} dangerouslySetInnerHTML={{ __html: t('votingMethods.exampleTakeaway2') }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingMethods;
