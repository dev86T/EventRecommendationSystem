import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decisionsAPI } from '../services/api';
import './CreateDecision.css';

const CreateDecision = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [alternatives, setAlternatives] = useState([
    { name: '', description: '' },
    { name: '', description: '' }
  ]);

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
        deadline: deadline.toISOString()
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
      alert('Ошибка создания решения');
    }
  };

  return (
    <div className="container create-decision">
      <div className="page-card">
        <h1>Создать новое решение</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название решения *</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Например: Выбор места для корпоратива"
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите контекст и критерии выбора"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>⏱️ Длительность голосования *</label>
            
            {/* Кастомный ввод времени */}
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
                <span style={{ fontWeight: 'bold' }}>минут</span>
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
                <span style={{ fontWeight: 'bold' }}>секунд</span>
              </div>
            </div>

            {/* Быстрые кнопки */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(1); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                1 мин
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(3); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                3 мин
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(5); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                5 мин
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(10); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                10 мин
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(60); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                1 час
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-secondary"
                onClick={() => { setMinutes(1440); setSeconds(0); }}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                1 день
              </button>
            </div>

            <p className="help-text" style={{ marginTop: '10px', color: '#666' }}>
              💡 Введите любое время, например: <strong>3 минуты 17 секунд</strong>
            </p>
          </div>

          <div className="alternatives-section">
            <h3>Варианты для выбора</h3>
            <p className="section-description">Добавьте минимум 2 варианта</p>
            
            {alternatives.map((alt, index) => (
              <div key={index} className="alternative-card">
                <div className="alternative-header">
                  <h4>Вариант {index + 1}</h4>
                  {alternatives.length > 2 && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeAlternative(index)}
                      title="Удалить вариант"
                    >
                      ❌
                    </button>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Название *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={alt.name}
                    onChange={(e) => updateAlternative(index, 'name', e.target.value)}
                    required
                    placeholder={`Например: Ресторан "Пушкин"`}
                  />
                </div>
                
                <div className="form-group">
                  <label>Описание (опционально)</label>
                  <textarea
                    className="form-control"
                    value={alt.description}
                    onChange={(e) => updateAlternative(index, 'description', e.target.value)}
                    placeholder="Дополнительные детали"
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
              + Добавить вариант
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg">
              Создать решение
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate(`/groups/${groupId}`)}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDecision;
