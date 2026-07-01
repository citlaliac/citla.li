import React, { useCallback, useEffect, useState } from 'react';
import { INGREDIENT_CATEGORIES } from './mealsConfig';
import {
  createIngredient,
  deleteIngredient,
  fetchIngredients,
  updateIngredient,
} from './mealsApi';

const EMPTY = { name: '', defaultUnit: 'each', category: 'Other' };

function IngredientsPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchIngredients(filter);
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing('new');
    setForm(EMPTY);
  };

  const openEdit = (item) => {
    setEditing(item.id);
    setForm({
      name: item.name,
      defaultUnit: item.defaultUnit,
      category: item.category,
    });
  };

  const closeForm = () => {
    setEditing(null);
    setForm(EMPTY);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing === 'new') {
        await createIngredient(form);
      } else {
        await updateIngredient(editing, form);
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ingredient?')) return;
    try {
      await deleteIngredient(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="meals-section">
      <div className="meals-toolbar">
        <label className="meals-filter">
          Category
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            {INGREDIENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="meals-btn meals-btn--primary" onClick={openNew}>
          Add ingredient
        </button>
      </div>

      {error && <p className="meals-error">{error}</p>}
      {loading && <p className="meals-muted">Loading…</p>}

      <ul className="meals-list">
        {items.map((item) => (
          <li key={item.id} className="meals-list-row">
            <div>
              <strong>{item.name}</strong>
              <span className="meals-list-meta">
                {item.category} · {item.defaultUnit}
              </span>
            </div>
            <div className="meals-list-actions">
              <button type="button" className="meals-btn" onClick={() => openEdit(item)}>
                Edit
              </button>
              <button type="button" className="meals-btn meals-btn--danger" onClick={() => handleDelete(item.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editing !== null && (
        <div className="meals-modal-backdrop" onClick={closeForm}>
          <form className="meals-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h2>{editing === 'new' ? 'New ingredient' : 'Edit ingredient'}</h2>
            <label>
              Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Default unit
              <input
                required
                value={form.defaultUnit}
                onChange={(e) => setForm({ ...form, defaultUnit: e.target.value })}
              />
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {INGREDIENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <div className="meals-modal-actions">
              <button type="button" className="meals-btn" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" className="meals-btn meals-btn--primary">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default IngredientsPage;
