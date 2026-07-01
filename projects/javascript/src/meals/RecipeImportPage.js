import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { INGREDIENT_CATEGORIES, RECIPE_CATEGORIES } from './mealsConfig';
import { createIngredient, createRecipe, fetchIngredients, importRecipePreview } from './mealsApi';
import { suggestIngredients } from './ingredientMatch';

function RecipeImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [step, setStep] = useState('url');
  const [preview, setPreview] = useState(null);
  const [existing, setExisting] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [form, setForm] = useState({
    name: '',
    category: 'Full Meal',
    servings: 4,
    instructions: '',
    tags: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIngredients().then(setExisting).catch(() => {});
  }, []);

  const handleFetch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const recipe = await importRecipePreview(url);
      setPreview(recipe);
      setForm({
        name: recipe.name,
        category: recipe.category || 'Full Meal',
        servings: recipe.servings || 4,
        instructions: recipe.instructions || '',
        tags: recipe.tags || [],
      });
      const initial = (recipe.ingredients || []).map((ing) => {
        const suggestions = suggestIngredients(ing.rawText, existing);
        return {
          rawText: ing.rawText,
          mode: suggestions[0]?.score > 0.5 ? 'existing' : 'new',
          ingredientId: suggestions[0]?.score > 0.5 ? String(suggestions[0].id) : '',
          newName: ing.rawText.slice(0, 80),
          newUnit: 'each',
          newCategory: 'Other',
          suggestions,
        };
      });
      setMappings(initial);
      setStep('map');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (index, patch) => {
    setMappings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleImport = async () => {
    setError('');
    setLoading(true);
    try {
      const resolved = [];
      for (const map of mappings) {
        if (map.mode === 'existing' && map.ingredientId) {
          resolved.push({
            ingredientId: Number(map.ingredientId),
            quantity: 1,
            unit: existing.find((i) => String(i.id) === map.ingredientId)?.defaultUnit || 'each',
          });
        } else if (map.mode === 'new' && map.newName.trim()) {
          const { id: newId } = await createIngredient({
            name: map.newName.trim(),
            defaultUnit: map.newUnit,
            category: map.newCategory,
          });
          resolved.push({
            ingredientId: newId,
            quantity: 1,
            unit: map.newUnit,
          });
        }
      }
      await createRecipe({
        ...form,
        servings: Number(form.servings) || 4,
        ingredients: resolved,
      });
      navigate('/meals/recipes');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="meals-section">
      <Link to="/meals/recipes" className="meals-back">
        ← Recipes
      </Link>
      <h2 className="meals-subtitle">Import from URL</h2>
      {error && <p className="meals-error">{error}</p>}

      {step === 'url' && (
        <form onSubmit={handleFetch} className="meals-form">
          <label>
            Recipe URL
            <input
              type="url"
              required
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
          <button type="submit" className="meals-btn meals-btn--primary" disabled={loading}>
            {loading ? 'Fetching…' : 'Preview import'}
          </button>
        </form>
      )}

      {step === 'map' && preview && (
        <div className="meals-import-map">
          <label>
            Recipe name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {RECIPE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Servings
            <input
              type="number"
              min={1}
              value={form.servings}
              onChange={(e) => setForm({ ...form, servings: e.target.value })}
            />
          </label>

          <h3>Match ingredients</h3>
          {mappings.map((map, index) => (
            <div key={map.rawText} className="meals-map-card">
              <p className="meals-map-raw">{map.rawText}</p>
              <div className="meals-map-options">
                <label>
                  <input
                    type="radio"
                    checked={map.mode === 'existing'}
                    onChange={() => updateMapping(index, { mode: 'existing' })}
                  />
                  Match existing
                </label>
                <label>
                  <input
                    type="radio"
                    checked={map.mode === 'new'}
                    onChange={() => updateMapping(index, { mode: 'new' })}
                  />
                  Create new
                </label>
              </div>
              {map.mode === 'existing' ? (
                <select
                  value={map.ingredientId}
                  onChange={(e) => updateMapping(index, { ingredientId: e.target.value })}
                >
                  <option value="">Select…</option>
                  {map.suggestions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  {existing
                    .filter((i) => !map.suggestions.find((s) => s.id === i.id))
                    .map((i) => (
                      <option key={`all-${i.id}`} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                </select>
              ) : (
                <div className="meals-new-ing-fields">
                  <input
                    value={map.newName}
                    onChange={(e) => updateMapping(index, { newName: e.target.value })}
                  />
                  <input
                    value={map.newUnit}
                    onChange={(e) => updateMapping(index, { newUnit: e.target.value })}
                  />
                  <select
                    value={map.newCategory}
                    onChange={(e) => updateMapping(index, { newCategory: e.target.value })}
                  >
                    {INGREDIENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            className="meals-btn meals-btn--primary"
            disabled={loading}
            onClick={handleImport}
          >
            {loading ? 'Saving…' : 'Confirm import'}
          </button>
        </div>
      )}
    </section>
  );
}

export default RecipeImportPage;
