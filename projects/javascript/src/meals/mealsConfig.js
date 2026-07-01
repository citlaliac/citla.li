export const INGREDIENT_CATEGORIES = [
  'Protein',
  'Legume',
  'Vegetable',
  'Fruit',
  'Grain',
  'Herb',
  'Dairy',
  'Condiment',
  'Other',
];

export const RECIPE_CATEGORIES = ['Protein', 'Legume', 'Salad', 'Vegetable', 'Full Meal'];

export const RECIPE_TAGS = [
  'High Protein',
  'High Fiber',
  'Office Lunch',
  'Freezer Friendly',
  'Spring',
  'Summer',
  'Fall',
  'Winter',
];

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const MEAL_TYPES = ['lunch', 'dinner'];

export const MEAL_FRAMEWORK = {
  Monday: {
    lunch: ['Hot legume item', 'Protein', 'Green vegetable', 'Fruit'],
    dinner: ['Protein', 'Salad', 'Fruit'],
  },
  Tuesday: {
    lunch: ['Hot legume item', 'Protein', 'Green vegetable', 'Fruit'],
    dinner: ['Protein', 'Salad', 'Fruit'],
  },
  Wednesday: {
    lunch: ['Hot legume item', 'Protein', 'Green vegetable', 'Fruit'],
    dinner: ['Protein', 'Salad', 'Fruit'],
  },
  Thursday: {
    lunch: ['Salad or legume', 'Protein', 'Green vegetable'],
    dinner: ['Protein', 'Vegetables'],
  },
  Friday: {
    lunch: ['Salad or legume', 'Protein', 'Green vegetable'],
    dinner: ['Restaurant / Flexible'],
  },
  Saturday: {
    lunch: ['Salad or legume', 'Protein', 'Green vegetable'],
    dinner: ['Restaurant / Flexible'],
  },
  Sunday: {
    lunch: ['Salad or legume', 'Protein', 'Green vegetable'],
    dinner: ['Restaurant / Flexible'],
  },
};

const isDev = process.env.NODE_ENV === 'development';

export function mealsApiBase() {
  return isDev ? 'http://localhost:4201/api/meals' : '/meals-api.php';
}

export function mealsImportUrl() {
  return isDev ? 'http://localhost:4201/api/meals/import' : '/meals-recipe-import.php';
}
