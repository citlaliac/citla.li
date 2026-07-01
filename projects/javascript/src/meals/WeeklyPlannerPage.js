import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DAY_NAMES, MEAL_FRAMEWORK, MEAL_TYPES } from './mealsConfig';
import { createPlan, fetchPlan, fetchPlans, fetchRecipes, updatePlan } from './mealsApi';

function emptyMeals() {
  const meals = [];
  for (let day = 0; day < 7; day += 1) {
    MEAL_TYPES.forEach((mealType) => {
      meals.push({ dayOfWeek: day, mealType, recipeId: null });
    });
  }
  return meals;
}

function mergeMeals(saved) {
  const base = emptyMeals();
  return base.map((slot) => {
    const found = saved.find(
      (m) => m.dayOfWeek === slot.dayOfWeek && m.mealType === slot.mealType
    );
    return found ? { ...slot, recipeId: found.recipeId } : slot;
  });
}

function WeeklyPlannerPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [name, setName] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [meals, setMeals] = useState(emptyMeals);
  const [frameworkOpen, setFrameworkOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeId = planId ? Number(planId) : null;

  const loadPlans = useCallback(async () => {
    const list = await fetchPlans();
    setPlans(list);
    return list;
  }, []);

  useEffect(() => {
    Promise.all([loadPlans(), fetchRecipes()])
      .then(([, recipeList]) => setRecipes(recipeList))
      .catch((e) => setError(e.message));
  }, [loadPlans]);

  useEffect(() => {
    if (!activeId) {
      setLoading(false);
      if (!weekStart) {
        const monday = new Date();
        const day = monday.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        monday.setDate(monday.getDate() + diff);
        setWeekStart(monday.toISOString().slice(0, 10));
        setName('Weekly plan');
      }
      return;
    }
    setLoading(true);
    fetchPlan(activeId)
      .then((plan) => {
        setName(plan.name);
        setWeekStart(plan.weekStart);
        setMeals(mergeMeals(plan.meals || []));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeId, weekStart]);

  const recipeOptions = useMemo(
    () => recipes.map((r) => ({ value: r.id, label: r.name })),
    [recipes]
  );

  const setSlot = (day, mealType, recipeId) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.dayOfWeek === day && m.mealType === mealType
          ? { ...m, recipeId: recipeId === '' ? null : Number(recipeId) }
          : m
      )
    );
  };

  const getSlot = (day, mealType) => {
    const slot = meals.find((m) => m.dayOfWeek === day && m.mealType === mealType);
    return slot?.recipeId ?? '';
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const payload = { name, weekStart, meals };
    try {
      if (activeId) {
        await updatePlan(activeId, payload);
      } else {
        const { id } = await createPlan(payload);
        navigate(`/meals/planner/${id}`, { replace: true });
        await loadPlans();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const startNewWeek = () => {
    navigate('/meals/planner');
    setMeals(emptyMeals());
    const monday = new Date();
    const day = monday.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday.setDate(monday.getDate() + diff);
    setWeekStart(monday.toISOString().slice(0, 10));
    setName('Weekly plan');
  };

  if (loading && activeId) {
    return <p className="meals-muted">Loading plan…</p>;
  }

  return (
    <section className="meals-section meals-planner">
      <div className="meals-toolbar meals-toolbar--wrap">
        <label>
          Saved weeks
          <select
            value={activeId || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) navigate(`/meals/planner/${val}`);
              else startNewWeek();
            }}
          >
            <option value="">New week…</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.weekStart})
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="meals-btn" onClick={startNewWeek}>
          New week
        </button>
        {activeId && (
          <Link to={`/meals/shopping/${activeId}`} className="meals-btn meals-btn--primary">
            Shopping list
          </Link>
        )}
      </div>

      <div className="meals-plan-meta">
        <label>
          Plan name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Week starting
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        </label>
      </div>

      <button
        type="button"
        className="meals-framework-toggle"
        onClick={() => setFrameworkOpen((o) => !o)}
      >
        {frameworkOpen ? 'Hide' : 'Show'} meal framework template
      </button>
      {frameworkOpen && (
        <div className="meals-framework">
          <h3>Your meal framework</h3>
          {DAY_NAMES.map((dayName) => (
            <div key={dayName} className="meals-framework-day">
              <strong>{dayName}</strong>
              {MEAL_TYPES.map((mt) => (
                <div key={mt}>
                  <em>{mt}</em>
                  <ul>
                    {(MEAL_FRAMEWORK[dayName]?.[mt] || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {error && <p className="meals-error">{error}</p>}

      <div className="meals-week-grid">
        {DAY_NAMES.map((dayName, dayIndex) => (
          <div key={dayName} className="meals-day-card">
            <h3>{dayName}</h3>
            {MEAL_TYPES.map((mealType) => (
              <label key={mealType} className="meals-slot">
                <span className="meals-slot-label">{mealType}</span>
                <select
                  value={getSlot(dayIndex, mealType) || ''}
                  onChange={(e) => setSlot(dayIndex, mealType, e.target.value)}
                >
                  <option value="">—</option>
                  {recipeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="meals-btn meals-btn--primary meals-save-week"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? 'Saving…' : 'Save week'}
      </button>
    </section>
  );
}

export default WeeklyPlannerPage;
