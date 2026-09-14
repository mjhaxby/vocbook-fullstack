import React, { useState } from 'react';
import { ColorPicker, hexToColorValue } from '@marcosfreitas/pastel-color-picker/headless';
import '@marcosfreitas/pastel-color-picker/style.css';
import api from '../api';

import '../css/pastel-color-picker.css';

const DEFAULT_COLOR =  hexToColorValue('#F0E8A5');

// lets the user define a new TagGroup (name, colour, uniqueness and which levels it applies to)
function TagGroupEditor({ onCreated }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [unique, setUnique] = useState(false);
  const [levels, setLevels] = useState({
    lemma_level: false,
    type_level: false,
    vocab_level: true,
    definition_level: true,
    translation_level: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // to do: word_class_restrictions / chunk_class_restrictions multiselects, once we need to restrict tag groups to specific classes

  const toggleLevel = (levelName) => {
    setLevels({ ...levels, [levelName]: !levels[levelName] });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await api.post('/api/tag-types/', {
        name: name.trim(),
        color: color.hexa,
        unique,
        ...levels,
      });
      setName('');
      setColor(DEFAULT_COLOR);
      setUnique(false);
      onCreated?.(response.data);
    } catch (err) {
      console.error('Error creating tag group:', err);
      setError('Could not create tag group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="tag-group-editor" onSubmit={handleSubmit}>
      <h4>New Tag Group</h4>
      <div className="mb-2">
        <label className="form-label">Name</label>
        <input
          type="text"
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label className="form-label d-block">Color</label>
        <ColorPicker
          defaultColor={color}
          presets={["#E2737E", "#F2A5A5" , "#A5E2D4", "#E8B4CB", "#F0C4A0", "#A5C9E2", "#F0E8A5"]}
          onColorChange={setColor}
          showColorBar={false}
          variant="circles"
          colorMode="pastel" 
          showAlpha={false}
        />
      </div>

      <div className="form-check mb-2">
        <input
          type="checkbox"
          className="form-check-input"
          id="tag-group-unique"
          checked={unique}
          onChange={() => setUnique(!unique)}
        />
        <label className="form-check-label" htmlFor="tag-group-unique">
          Unique (only one tag from this group per vocab)
        </label>
      </div>

      <div className="mb-2">
        <label className="form-label d-block">Applies to</label>
        {Object.keys(levels).map((levelName) => (
          <div className="form-check form-check-inline" key={levelName}>
            <input
              type="checkbox"
              className="form-check-input"
              id={`tag-group-${levelName}`}
              checked={levels[levelName]}
              onChange={() => toggleLevel(levelName)}
            />
            <label className="form-check-label" htmlFor={`tag-group-${levelName}`}>
              {levelName.replace('_level', '')}
            </label>
          </div>
        ))}
      </div>

      {error && <p className="text-danger">{error}</p>}

      <button type="submit" className="btn btn-success" disabled={saving}>
        {saving ? 'Saving…' : 'Add Tag Group'}
      </button>
    </form>
  );
}

export default TagGroupEditor;