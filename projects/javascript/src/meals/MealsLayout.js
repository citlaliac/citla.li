import React, { useEffect } from 'react';
import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import IngredientsPage from './IngredientsPage';
import RecipesPage from './RecipesPage';
import RecipeEditPage from './RecipeEditPage';
import RecipeImportPage from './RecipeImportPage';
import WeeklyPlannerPage from './WeeklyPlannerPage';
import ShoppingListPage from './ShoppingListPage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import '../styles/meals/Meals.css';

function MealsLayout() {
  const location = useLocation();

  useSEO({
    title: 'Meal planner | citla.li',
    description: 'Personal meal planner, recipes, weekly plans, and shopping lists.',
    canonicalUrl: 'https://citla.li/meals',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="meals-page">
      <Header />
      <main className="meals-main">
        <header className="meals-header">
          <h1 className="meals-title">Meal planner</h1>
          <p className="meals-tagline">Recipes, weekly plans, and shopping lists</p>
        </header>
        <Routes>
          <Route path="/meals" element={<Navigate to="/meals/planner" replace />} />
          <Route path="/meals/ingredients" element={<IngredientsPage />} />
          <Route path="/meals/recipes" element={<RecipesPage />} />
          <Route path="/meals/recipes/new" element={<RecipeEditPage />} />
          <Route path="/meals/recipes/import" element={<RecipeImportPage />} />
          <Route path="/meals/recipes/:id/edit" element={<RecipeEditPage />} />
          <Route path="/meals/planner" element={<WeeklyPlannerPage />} />
          <Route path="/meals/planner/:planId" element={<WeeklyPlannerPage />} />
          <Route path="/meals/shopping" element={<ShoppingListPage />} />
          <Route path="/meals/shopping/:planId" element={<ShoppingListPage />} />
        </Routes>
      </main>
      <nav className="meals-bottom-nav" aria-label="Meal planner sections">
        <NavLink to="/meals/ingredients" className="meals-nav-link">
          Ingredients
        </NavLink>
        <NavLink to="/meals/recipes" className="meals-nav-link">
          Recipes
        </NavLink>
        <NavLink to="/meals/planner" className="meals-nav-link">
          Planner
        </NavLink>
        <NavLink to="/meals/shopping" className="meals-nav-link">
          Shop
        </NavLink>
      </nav>
      <Footer />
    </div>
  );
}

export default MealsLayout;
