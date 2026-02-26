import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decisionsAPI } from '../services/api';
import './CreateDecision.css';

const CreateDecision = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
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
      deadline.setMinutes(deadline.getMinutes() + parseInt(durationMinutes));

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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                className="form-control"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
                style={{ maxWidth: '200px' }}
              >
                <option value="5">5 минут (тест)</option>
                <option value="15">15 минут</option>
                <option value="30">30 минут</option>
                <option value="60">1 час</option>
                <option value="120">2 часа</option>
                <option value="180">3 часа</option>
                <option value="360">6 часов</option>
                <option value="720">12 часов</option>
                <option value="1440">1 день</option>
                <option value="2880">2 дня</option>
                <option value="4320">3 дня</option>
                <option value="10080">1 неделя</option>
              </select>
            </div>
            <p className="help-text" style={{ marginTop: '8px' }}>
              Голосование автоматически завершится через указанное время
            </p>
          </div>

          <div className="alternatives-section">
            <h3>Варианты для выбора</h3>
            <p className="help-text">
              Добавьте минимум 2 варианта. Участники будут ранжировать их по предпочтениям.
            </p>

            {alternatives.map((alt, index) => (
              <div key={index} className="alternative-item">
                <div className="alternative-header">
                  <h4>Вариант {index + 1}</h4>
                  {alternatives.length > 2 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeAlternative(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    value={alt.name}
                    onChange={(e) => updateAlternative(index, 'name', e.target.value)}
                    required
                    placeholder="Название варианта"
                  />
                </div>
                <div className="form-group">
                  <textarea
                    className="form-control"
                    value={alt.description}
                    onChange={(e) => updateAlternative(index, 'description', e.target.value)}
                    placeholder="Описание варианта (опционально)"
                    rows="2"
                  />
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-secondary" onClick={addAlternative}>
              + Добавить вариант
            </button>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary">
              Создать решение
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDecision;
