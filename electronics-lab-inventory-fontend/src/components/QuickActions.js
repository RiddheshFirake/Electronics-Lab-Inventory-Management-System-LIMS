// src/components/QuickActions.js
import React from 'react';
import { MdAddCircleOutline, MdFileUpload, MdDownload } from 'react-icons/md';
import './RightSidebarSection.css'; // Shared CSS for sections

const QuickActions = () => {
    // Define an array of quick actions with their names, icons, and keyboard shortcuts.
    const actions = [
        {
            name: 'Create Order',
            icon: <MdAddCircleOutline />,
            shortcut: 'ctrl + n'
        },
        {
            name: 'Add Product',
            icon: <MdAddCircleOutline />,
            shortcut: 'ctrl + p'
        },
        {
            name: 'Add Supplier',
            icon: <MdAddCircleOutline />,
            shortcut: 'ctrl + k'
        },
        {
            name: 'Export',
            icon: <MdDownload />,
            shortcut: 'ctrl + s'
        },
        // You can add more actions here as needed, e.g., for file uploads
        // {
        //     name: 'Upload Data',
        //     icon: <MdFileUpload />,
        //     shortcut: 'ctrl + u'
        // },
    ];

    return (
        <div className="right-sidebar-section">
            <h3>Quick Actions</h3>
            <ul className="action-list">
                {actions.map((action) => (
                    <li key={action.name} className="action-item">
                        {action.icon}
                        <span>{action.name}</span>
                        <span className="shortcut">{action.shortcut}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default QuickActions;
