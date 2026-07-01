import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  fetchPlans,
  fetchShoppingList,
  generateShoppingList,
  resetShoppingList,
  toggleShoppingItem,
} from './mealsApi';

function ShoppingListPage() {
  const { planId: routePlanId } = useParams();
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState(routePlanId ? Number(routePlanId) : '');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans()
      .then((p) => {
        setPlans(p);
        if (!planId && p.length > 0 && !routePlanId) {
          setPlanId(p[0].id);
        }
      })
      .catch((e) => setError(e.message));
  }, [planId, routePlanId]);

  const loadList = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchShoppingList(id);
      setList(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (planId) loadList(planId);
  }, [planId, loadList]);

  const handleGenerate = async () => {
    if (!planId) return;
    setLoading(true);
    setError('');
    try {
      const data = await generateShoppingList(planId);
      setList(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await toggleShoppingItem(item.id, !item.isChecked);
      setList((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === item.id ? { ...i, isChecked: !i.isChecked } : i
        ),
      }));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleReset = async () => {
    if (!planId) return;
    try {
      await resetShoppingList(planId);
      loadList(planId);
    } catch (e) {
      setError(e.message);
    }
  };

  const grouped = (list?.items || []).reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <section className="meals-section meals-shopping">
      <div className="meals-toolbar meals-toolbar--wrap">
        <label>
          Weekly plan
          <select value={planId} onChange={(e) => setPlanId(Number(e.target.value) || '')}>
            <option value="">Select plan…</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.weekStart})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="meals-btn meals-btn--primary"
          disabled={!planId || loading}
          onClick={handleGenerate}
        >
          Generate shopping list
        </button>
        <button type="button" className="meals-btn" disabled={!planId} onClick={handleReset}>
          Reset checked
        </button>
        {planId > 0 && (
          <Link to={`/meals/planner/${planId}`} className="meals-btn">
            Edit plan
          </Link>
        )}
      </div>

      {error && <p className="meals-error">{error}</p>}
      {loading && <p className="meals-muted">Loading…</p>}

      {list?.generatedAt && (
        <p className="meals-muted">Generated {new Date(list.generatedAt).toLocaleString()}</p>
      )}

      {!list?.items?.length && planId && !loading && (
        <p className="meals-muted">No list yet. Assign recipes to the week, then generate.</p>
      )}

      <ul className="meals-shop-list">
        {Object.keys(grouped).map((category) => (
          <li key={category} className="meals-shop-group">
            <h3 className="meals-shop-category">{category}</h3>
            <ul>
              {grouped[category].map((item) => (
                <li key={item.id}>
                  <label className="meals-shop-item">
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={() => handleToggle(item)}
                    />
                    <span className={item.isChecked ? 'meals-shop-checked' : ''}>
                      {item.ingredientName} — {item.quantity} {item.unit}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ShoppingListPage;
