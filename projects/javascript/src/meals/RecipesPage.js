import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RECIPE_CATEGORIES, RECIPE_TAGS } from './mealsConfig';
import { deleteRecipe, fetchRecipes } from './mealsApi';

function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchRecipes({ category, tag });
      setRecipes(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category, tag]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await deleteRecipe(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section className="meals-section">
      <div className="meals-toolbar">
        <label className="meals-filter">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            {RECIPE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="meals-filter">
          Tag
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">All</option>
            {RECIPE_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <Link to="/meals/recipes/new" className="meals-btn meals-btn--primary">
          New recipe
        </Link>
        <Link to="/meals/recipes/import" className="meals-btn">
          Import URL
        </Link>
      </div>

      {error && <p className="meals-error">{error}</p>}
      {loading && <p className="meals-muted">Loading…</p>}

      <ul className="meals-list">
        {recipes.map((r) => (
          <li key={r.id} className="meals-list-row">
            <div>
              <strong>{r.name}</strong>
              <span className="meals-list-meta">
                {r.category} · {r.servings} servings
                {r.tags?.length > 0 && ` · ${r.tags.join(', ')}`}
              </span>
            </div>
            <div className="meals-list-actions">
              <Link to={`/meals/recipes/${r.id}/edit`} className="meals-btn">
                Edit
              </Link>
              <button type="button" className="meals-btn meals-btn--danger" onClick={() => handleDelete(r.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RecipesPage;
