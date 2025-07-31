// src/components/RecentActivity.js
import React from 'react';
import './RightSidebarSection.css'; // Shared CSS for sections, likely used by QuickActions as well

const RecentActivity = () => {
    // This data is currently hardcoded. In a real application,
    // you would fetch this from your backend's dashboard/user-activity endpoint
    // using a useEffect hook and an API call (e.g., Axios).
    const activities = [
        {
            type: 'Restocked',
            count: 6,
            item: 'Macbook Pro',
            time: '1 m ago'
        },
        {
            type: 'Sold',
            count: 3,
            item: 'iPhone 14 pro',
            time: '12 m ago'
        },
        {
            type: 'Sold',
            count: 1,
            item: 'Zoom75',
            time: '23 m ago'
        },
        {
            type: 'Restocked',
            count: 12,
            item: 'Zoom75',
            time: '42 m ago'
        },
        {
            type: 'Sold',
            count: 3,
            item: 'Samsung Odyssey',
            time: '2 h ago'
        },
        // Add more recent activities as needed
    ];

    return (
        <div className="right-sidebar-section">
            <h3>Recent Activity</h3>
            <ul className="activity-list">
                {activities.map((activity, index) => (
                    <li key={index} className="activity-item">
                        <div className="activity-details">
                            <span className="activity-type">{activity.type}</span>
                            <span className="activity-count">{activity.count}</span>
                            <span className="activity-item-name">{activity.item}</span>
                        </div>
                        <span className="activity-time">{activity.time}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RecentActivity;
