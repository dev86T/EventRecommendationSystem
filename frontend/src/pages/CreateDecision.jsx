import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decisionsAPI } from '../services/api';
import './CreateDecision.css';

const CreateDecision = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      // Создаем решение
      const decisionRes = await decisionsAPI.create({
        groupId,
        title,
        description
      });

      const decisionId = decisionRes.data.id;

      // Добавляем альтернативы
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
            />
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
