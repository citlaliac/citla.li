import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RECIPE_CATEGORIES, RECIPE_TAGS } from './mealsConfig';
import {
  createRecipe,
  fetchIngredients,
  fetchRecipe,
  updateRecipe,
} from './mealsApi';

const emptyIngredientRow = () => ({ ingredientId: '', quantity: 1, unit: 'each' });

function RecipeEditPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const [form, setForm] = useState({
    name: '',
    category: 'Full Meal',
    servings: 4,
    notes: '',
    instructions: '',
    tags: [],
    ingredients: [emptyIngredientRow()],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!isNew);

  const loadIngredients = useCallback(async () => {
    const list = await fetchIngredients();
    setIngredientOptions(list);
  }, []);

  useEffect(() => {
    loadIngredients().catch((e) => setError(e.message));
  }, [loadIngredients]);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    fetchRecipe(id)
      .then((recipe) => {
        setForm({
          name: recipe.name,
          category: recipe.category,
          servings: recipe.servings,
          notes: recipe.notes || '',
          instructions: recipe.instructions || '',
          tags: recipe.tags || [],
          ingredients:
            recipe.ingredients?.length > 0
              ? recipe.ingredients.map((ri) => ({
                  ingredientId: String(ri.ingredientId),
                  quantity: ri.quantity,
                  unit: ri.unit,
                }))
              : [emptyIngredientRow()],
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const toggleTag = (tag) => {
    setForm((prev) => {
      const has = prev.tags.includes(tag);
      return {
        ...prev,
        tags: has ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  };

  const updateRow = (index, field, value) => {
    setForm((prev) => {
      const ingredients = [...prev.ingredients];
      ingredients[index] = { ...ingredients[index], [field]: value };
      if (field === 'ingredientId') {
        const ing = ingredientOptions.find((o) => String(o.id) === String(value));
        if (ing) ingredients[index].unit = ing.defaultUnit;
      }
      return { ...prev, ingredients };
    });
  };

  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, emptyIngredientRow()],
    }));
  };

  const removeRow = (index) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      servings: Number(form.servings) || 4,
      ingredients: form.ingredients
        .filter((row) => row.ingredientId)
        .map((row) => ({
          ingredientId: Number(row.ingredientId),
          quantity: Number(row.quantity) || 1,
          unit: row.unit || 'each',
        })),
    };
    try {
      if (isNew) {
        const { id: newId } = await createRecipe(payload);
        navigate(`/meals/recipes/${newId}/edit`, { replace: true });
      } else {
        await updateRecipe(Number(id), payload);
        navigate('/meals/recipes');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <p className="meals-muted">Loading recipe…</p>;
  }

  return (
    <section className="meals-section">
      <Link to="/meals/recipes" className="meals-back">
        ← Recipes
      </Link>
      <h2 className="meals-subtitle">{isNew ? 'New recipe' : 'Edit recipe'}</h2>
      {error && <p className="meals-error">{error}</p>}

      <form className="meals-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
        <fieldset className="meals-tags-field">
          <legend>Tags</legend>
          <div className="meals-tag-chips">
            {RECIPE_TAGS.map((tag) => (
              <label key={tag} className="meals-tag-chip">
                <input
                  type="checkbox"
                  checked={form.tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          Notes
          <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <label>
          Instructions
          <textarea
            rows={6}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </label>

        <h3>Ingredients</h3>
        {form.ingredients.map((row, index) => (
          <div key={`row-${index}`} className="meals-ingredient-row">
            <select
              required={index === 0}
              value={row.ingredientId}
              onChange={(e) => updateRow(index, 'ingredientId', e.target.value)}
            >
              <option value="">Select…</option>
              {ingredientOptions.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="any"
              min={0}
              value={row.quantity}
              onChange={(e) => updateRow(index, 'quantity', e.target.value)}
            />
            <input value={row.unit} onChange={(e) => updateRow(index, 'unit', e.target.value)} />
            <button type="button" className="meals-btn" onClick={() => removeRow(index)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="meals-btn" onClick={addRow}>
          Add ingredient row
        </button>

        <div className="meals-form-actions">
          <button type="submit" className="meals-btn meals-btn--primary">
            Save recipe
          </button>
        </div>
      </form>
    </section>
  );
}

export default RecipeEditPage;
