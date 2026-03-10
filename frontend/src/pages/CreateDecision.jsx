import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { decisionsAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import './CreateDecision.css';

const CreateDecision = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill;
  const { t } = useLanguage();

  const [title, setTitle] = useState(prefill?.title || '');
  const [description, setDescription] = useState(prefill?.description || '');
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [alternatives, setAlternatives] = useState(
    prefill?.alternatives?.length >= 2
      ? prefill.alternatives
      : [{ name: '', description: '' }, { name: '', description: '' }]
  );
  const [isBlindVoting, setIsBlindVoting] = useState(prefill?.isBlindVoting || false);
  const [isAnonymous, setIsAnonymous] = useState(prefill?.isAnonymous || false);

  const addAlternative = () => {
    setAlternatives([...alternatives, { name: '', description: '' }]);
  };

  const removeAlternative = (index) => {
    if (alternatives.length > 2) {
      setAlternatives(alternatives.filter((_, i) => i !== index));
    }
  };

  const updateAlternative = (index, field, value) => {
    const updated = [...alternatives];
    updated[index][field] = value;
    setAlternatives(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const deadline = new Date();
      const totalSeconds = (parseInt(minutes) * 60) + parseInt(seconds);
      deadline.setSeconds(deadline.getSeconds() + totalSeconds);

      console.log('[CREATE DECISION] Deadline:', {
        minutes,
        seconds,
        totalSeconds,
        deadline: deadline.toISOString()
      });

      const decisionRes = await decisionsAPI.create({
        groupId,
        title,
        description,
        deadline: deadline.toISOString(),
        isBlindVoting,
        isAnonymous
      });

      const decisionId = decisionRes.data.id;

      for (const alt of alternatives) {
        if (alt.name.trim()) {
          await decisionsAPI.addAlternative(decisionId, alt);
        }
      }

      navigate(`/decisions/${decisionId}`);
    } catch (error) {
      console.error('Error creating decision:', error);
      alert(t('createDecision.errorCreating'));
    }
  };

  return (
    <div className="container create-decision">
      <div className="page-card">
        <h1>{prefill ? t('createDecision.repeatTitle') : t('createDecision.title')}</h1>
        {prefill && (
          <p style={{ color: '#718096', marginBottom: '24px', marginTop: '-16px' }}>
            {t('createDecision.repeatDesc')}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('createDecision.nameLabel')}</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={t('createDecision.namePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label>{t('createDecision.descLabel')}</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('createDecision.descPlaceholder')}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>{t('createDecision.durationLabel')}</label>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="number"
                  className="form-control"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  max="10080"
                  required
                  style={{ width: '100px' }}
                  placeholder="0"
                />
                <span style={{ fontWeight: 'bold' }}>{t('createDecision.minutes')}</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="number"
                  className="form-control"
                  value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  min="0"
                  max="59"
                  style={{ width: '100px' }}
                  placeholder="0"
                />
                <span style={{ fontWeight: 'bold' }}>{t('createDecision.seconds')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(1); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                {t('createDecision.min1')}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(3); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                {t('createDecision.min3')}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(5); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                {t('createDecision.min5')}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(10); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                {t('createDecision.min10')}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(60); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                {t('createDecision.hour1')}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(1440); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                {t('createDecision.day1')}
              </button>
            </div>

            <p
              className="help-text"
              style={{ marginTop: '10px', color: '#666' }}
              dangerouslySetInnerHTML={{ __html: t('createDecision.durationHint') }}
            />
          </div>

          <div className="form-group">
            <label>{t('createDecision.votingMode')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isBlindVoting}
                  onChange={(e) => setIsBlindVoting(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{t('createDecision.blindVoting')}</div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                    {t('createDecision.blindVotingDesc')}
                  </div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{t('createDecision.anonymous')}</div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                    {t('createDecision.anonymousDesc')}
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="alternatives-section">
            <h3>{t('createDecision.alternativesTitle')}</h3>
            <p className="section-description">{t('createDecision.alternativesMinHint')}</p>

            {alternatives.map((alt, index) => (
              <div key={index} className="alternative-card">
                <div className="alternative-header">
                  <h4>{t('createDecision.option', { n: index + 1 })}</h4>
                  {alternatives.length > 2 && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeAlternative(index)}
                      title={t('createDecision.removeOption')}
                    >
                      ❌
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>{t('createDecision.optionName')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={alt.name}
                    onChange={(e) => updateAlternative(index, 'name', e.target.value)}
                    required
                    placeholder={t('createDecision.optionNamePlaceholder')}
                  />
                </div>

                <div className="form-group">
                  <label>{t('createDecision.optionDesc')}</label>
                  <textarea
                    className="form-control"
                    value={alt.description}
                    onChange={(e) => updateAlternative(index, 'description', e.target.value)}
                    placeholder={t('createDecision.optionDescPlaceholder')}
                    rows="2"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={addAlternative}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {t('createDecision.addOption')}
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg">
              {t('createDecision.submit')}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/groups/${groupId}`)}
            >
              {t('createDecision.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDecision;
