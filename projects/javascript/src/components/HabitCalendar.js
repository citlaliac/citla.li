import React from 'react';
import '../styles/HabitCalendar.css';

const HabitCalendar = ({ completedDates = [] }) => {
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Create array of all dates in the year
    const allDates = [];
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        allDates.push({
            date: dateStr,
            completed: completedDates.includes(dateStr)
        });
    }

    // Group dates by month
    const months = Array.from({ length: 12 }, (_, i) => {
        const monthDates = allDates.filter(d => new Date(d.date).getMonth() === i);
        return {
            name: new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' }),
            dates: monthDates
        };
    });

    return (
        <div className="habit-calendar">
            <h3>Habit Completion Calendar</h3>
            <div className="calendar-grid">
                {months.map((month, index) => (
                    <div key={index} className="month-container">
                        <div className="month-name">{month.name}</div>
                        <div className="month-days">
                            {month.dates.map((day, dayIndex) => (
                                <div 
                                    key={dayIndex} 
                                    className={`calendar-day ${day.completed ? 'completed' : ''}`}
                                    title={day.date}
                                >
                                    {day.completed ? '✓' : ''}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HabitCalendar; 