import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HabitCalendar from '../components/HabitCalendar';
import '../styles/HabitTracker.css';

const HabitTrackerPage = () => {
    const [habits, setHabits] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');
    const [completedDates, setCompletedDates] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHabits();
        fetchCompletedDates();
    }, [selectedDate]);

    const fetchCompletedDates = async () => {
        try {
            const response = await fetch(`/habits.php?get_completed_dates=1`);
            const data = await response.json();
            if (data.success) {
                setCompletedDates(data.dates);
            } else {
                console.error('Error fetching completed dates:', data.error);
            }
        } catch (error) {
            console.error('Error fetching completed dates:', error);
        }
    };

    const fetchHabits = async () => {
        try {
            console.log('Fetching habits for date:', selectedDate);
            const response = await fetch(`/habits.php?date=${selectedDate}`);
            const data = await response.json();
            console.log('Fetched habits:', data);
            
            if (data.success) {
                setHabits(data.habits);
                setError('');
            } else {
                setError(data.error || 'Error fetching habits');
                console.error('Error fetching habits:', data.error);
            }
        } catch (error) {
            setError('Error fetching habits: ' + error.message);
            console.error('Error fetching habits:', error);
        }
    };

    const toggleHabit = async (habitId) => {
        try {
            const currentHabit = habits.find(h => h.id === habitId);
            if (!currentHabit) {
                console.error('Habit not found:', habitId);
                return;
            }

            const newCompleted = !currentHabit.completed;
            console.log('Toggling habit:', {
                habitId,
                currentCompleted: currentHabit.completed,
                newCompleted,
                date: selectedDate
            });

            const response = await fetch('/habits.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    habit_id: habitId,
                    completed: newCompleted,
                    date: selectedDate
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Server response:', data);

            if (data.success && data.habit) {
                setHabits(prevHabits => 
                    prevHabits.map(habit => 
                        habit.id === habitId ? data.habit : habit
                    )
                );
            } else {
                throw new Error('Failed to update habit');
            }
        } catch (error) {
            console.error('Error toggling habit:', error);
            setError('Failed to update habit. Please try again.');
        }
    };

    return (
        <div className="habit-tracker-page">
            <div className="habit-tracker-content">
                <div className="habit-tracker-header">
                    <h1>Habit Tracker</h1>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-picker"
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="habit-tracker-container">
                    {habits.length === 0 ? (
                        <div className="no-habits">No habits found</div>
                    ) : (
                        habits.map(habit => (
                            <div key={habit.id} className="habit-item">
                                <div className="habit-info">
                                    <h3>{habit.name}</h3>
                                    {habit.description && <p>{habit.description}</p>}
                                    <div className="habit-stats">
                                        <span>Days Completed: {habit.days_completed}</span>
                                        <span className="completion-percentage">
                                            {habit.completion_percentage}% since 4/25/2024
                                        </span>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={habit.completed}
                                    onChange={() => toggleHabit(habit.id)}
                                    className="habit-toggle"
                                />
                            </div>
                        ))
                    )}
                </div>

                <HabitCalendar completedDates={completedDates} />
            </div>
        </div>
    );
};

export default HabitTrackerPage; 