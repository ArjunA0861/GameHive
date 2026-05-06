import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder, icon: Icon }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value == value);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            style={{ position: 'relative', minWidth: '160px' }}
        >
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'rgba(20, 20, 20, 0.8)',
                    border: isOpen ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#fff',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 0 15px rgba(var(--primary-rgb), 0.2)' : 'none',
                    backdropFilter: 'blur(10px)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    {Icon && <Icon size={16} color="var(--primary)" />}
                    <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: selectedOption ? '#fff' : 'var(--text-muted)'
                    }}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: 'var(--text-muted)',
                        marginLeft: '8px'
                    }}
                />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0, // removed width: '100%' to allow natural width if needed, but right:0 constraints it
                    minWidth: '200px', // Slightly wider than button if needed
                    maxHeight: '300px',
                    overflowY: 'auto',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    {/* Header Gradient */}
                    <div style={{
                        height: '4px',
                        background: 'linear-gradient(90deg, var(--primary) 0%, #8b5cf6 100%)',
                        width: '100%'
                    }} />

                    <div style={{ padding: '6px' }}>
                        {/* Option: All */}
                        <div
                            onClick={() => handleSelect('')}
                            className="custom-option"
                            style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                color: value === '' ? '#fff' : '#d4d4d4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: value === '' ? 'rgba(255,255,255,0.05)' : 'transparent'
                            }}
                        >
                            <span>{placeholder}</span>
                            {value === '' && <Check size={14} color="var(--primary)" />}
                        </div>

                        {/* Options List */}
                        {options.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className="custom-option"
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    color: value == opt.value ? '#fff' : '#d4d4d4',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: '2px',
                                    background: value == opt.value ? 'rgba(255,255,255,0.05)' : 'transparent'
                                }}
                            >
                                <span>{opt.label}</span>
                                {value == opt.value && <Check size={14} color="var(--primary)" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .custom-option:hover {
                    background: rgba(255,255,255,0.1) !important;
                    color: #fff !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
