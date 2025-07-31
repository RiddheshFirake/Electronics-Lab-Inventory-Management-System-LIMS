// src/components/DashboardCard.js
import React from 'react';

const DashboardCard = ({ title, value, icon, trend, color, isCurrency = false }) => {
    // Color mapping for better visual appeal
    const getColorShades = (colorName) => {
        const colorMap = {
            blue: { bg: '#667eea', light: '#667eea15', border: '#667eea25' },
            green: { bg: '#3dc47e', light: '#3dc47e15', border: '#3dc47e25' },
            red: { bg: '#e53e3e', light: '#e53e3e15', border: '#e53e3e25' },
            orange: { bg: '#fd7e14', light: '#fd7e1415', border: '#fd7e1425' },
            purple: { bg: '#9f7aea', light: '#9f7aea15', border: '#9f7aea25' },
            teal: { bg: '#38b2ac', light: '#38b2ac15', border: '#38b2ac25' },
            yellow: { bg: '#f6e05e', light: '#f6e05e15', border: '#f6e05e25' },
            pink: { bg: '#ed64a6', light: '#ed64a615', border: '#ed64a625' },
        };
        return colorMap[color] || colorMap.blue;
    };

    const colors = getColorShades(color);

    // Format large numbers with commas
    const formatValue = (val) => {
        if (typeof val === 'number' && val >= 1000) {
            return val.toLocaleString();
        }
        return val;
    };

    return (
        <>
            <div 
                className="dashboard-card"
                style={{
                    background: `linear-gradient(135deg, ${colors.light} 0%, ${colors.bg}08 100%)`,
                    border: `1px solid ${colors.border}`,
                }}
            >
                <div className="card-header">
                    <div
                        className="card-icon"
                        style={{
                            background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg}dd 100%)`,
                            boxShadow: `0 4px 12px ${colors.bg}25`
                        }}
                    >
                        {icon}
                    </div>
                    {trend && (
                        <div
                            className="card-trend"
                            style={{
                                color: trend.startsWith('+') ? '#10b981' : '#ef4444',
                                background: trend.startsWith('+') ? '#10b98115' : '#ef444415',
                                border: `1px solid ${trend.startsWith('+') ? '#10b98125' : '#ef444425'}`
                            }}
                        >
                            {trend}
                        </div>
                    )}
                </div>
                <div className="card-content">
                    <div className="card-title">{title}</div>
                    <div className="card-value">
                        {isCurrency ? `₹${formatValue(value)}` : formatValue(value)}
                    </div>
                </div>
                <div className="card-glow" style={{ background: colors.bg }}></div>
            </div>

            {/* Inline CSS */}
            <style jsx>{`
                .dashboard-card {
                    position: relative;
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 24px 20px 20px 20px;
                    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                    min-height: 140px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    cursor: pointer;
                }

                .dashboard-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
                }

                .dashboard-card:hover .card-glow {
                    opacity: 0.03;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 16px;
                }

                .card-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 1.4rem;
                    transition: all 0.3s ease;
                    position: relative;
                    z-index: 2;
                }

                .dashboard-card:hover .card-icon {
                    transform: scale(1.05);
                }

                .card-trend {
                    font-size: 0.85rem;
                    font-weight: 600;
                    padding: 4px 8px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    letter-spacing: 0.02em;
                }

                .card-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    position: relative;
                    z-index: 2;
                }

                .card-title {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    line-height: 1.3;
                }

                .card-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #1f2937;
                    line-height: 1.2;
                    letter-spacing: -0.02em;
                }

                .card-glow {
                    position: absolute;
                    top: -50%;
                    right: -50%;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                    filter: blur(40px);
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .dashboard-card {
                        padding: 20px 16px 16px 16px;
                        min-height: 120px;
                    }

                    .card-icon {
                        width: 42px;
                        height: 42px;
                        font-size: 1.2rem;
                    }

                    .card-value {
                        font-size: 1.5rem;
                    }

                    .card-title {
                        font-size: 0.85rem;
                    }
                }

                @media (max-width: 480px) {
                    .dashboard-card {
                        padding: 16px 14px 14px 14px;
                        min-height: 110px;
                    }

                    .card-header {
                        margin-bottom: 12px;
                    }

                    .card-icon {
                        width: 38px;
                        height: 38px;
                        font-size: 1.1rem;
                    }

                    .card-value {
                        font-size: 1.4rem;
                    }

                    .card-title {
                        font-size: 0.8rem;
                    }
                }

                /* Animation for value changes */
                @keyframes valueChange {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                .card-value {
                    animation: valueChange 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default DashboardCard;
