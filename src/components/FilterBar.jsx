import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Monitor, Star } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import CustomSelect from './CustomSelect';

export default function FilterBar({
    onSearch,
    onFilterChange,
    genres = [],
    platforms = [],
    initialFilters = {}
}) {
    const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
    const [selectedGenre, setSelectedGenre] = useState(initialFilters.genre || '');
    const [selectedPlatform, setSelectedPlatform] = useState(initialFilters.platform || '');
    const [selectedSort, setSelectedSort] = useState(initialFilters.sort || '-added');
    const [rating, setRating] = useState(initialFilters.rating || '');

    const debouncedSearch = useDebounce(searchTerm, 500);

    // Effect for Debounced Search
    useEffect(() => {
        onSearch(debouncedSearch);
    }, [debouncedSearch]);

    // Handle Dropdown Changes

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedGenre('');
        setSelectedPlatform('');
        setSelectedSort('-added');
        setRating('');
        onFilterChange('clear', null);
    };

    return (
        <div style={{
            position: 'sticky',
            top: '90px', // Adjusted to sit below the floating Navbar
            zIndex: 40,
            background: 'rgba(18, 18, 18, 0.95)',
            backdropFilter: 'blur(12px)',
            padding: '1rem',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '2rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>

            {/* Search Input */}
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Search games..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 10px 10px 40px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        outline: 'none',
                        fontSize: '0.95rem'
                    }}
                />
            </div>

            {/* Filters Group */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>

                {/* Genre Dropdown */}
                <CustomSelect
                    options={genres.map(g => ({ value: g.id, label: g.name }))}
                    value={selectedGenre}
                    onChange={(val) => {
                        setSelectedGenre(val);
                        onFilterChange('genre', val);
                    }}
                    placeholder="All Genres"
                    icon={Filter}
                />

                {/* Platform Dropdown */}
                <CustomSelect
                    options={platforms.map(p => ({ value: p.id, label: p.name }))}
                    value={selectedPlatform}
                    onChange={(val) => {
                        setSelectedPlatform(val);
                        onFilterChange('platform', val);
                    }}
                    placeholder="All Platforms"
                    icon={Monitor}
                />

                {/* Rating Dropdown */}
                <CustomSelect
                    options={[
                        { value: '90', label: '90+ Metacritic' },
                        { value: '80', label: '80+ Metacritic' },
                        { value: '70', label: '70+ Metacritic' }
                    ]}
                    value={rating}
                    onChange={(val) => {
                        setRating(val);
                        onFilterChange('rating', val);
                    }}
                    placeholder="All Ratings"
                    icon={Star}
                />

                {/* Sort Dropdown */}
                <CustomSelect
                    options={[
                        { value: '-added', label: 'Popularity' },
                        { value: '-rating', label: 'Top Rated' },
                        { value: '-released', label: 'Newest' },
                        { value: 'name', label: 'Name (A-Z)' }
                    ]}
                    value={selectedSort}
                    onChange={(val) => {
                        setSelectedSort(val);
                        onFilterChange('sort', val);
                    }}
                    placeholder="Sort By"
                    icon={Filter}
                />

                {/* Clear Button */}
                {(selectedGenre || selectedPlatform || rating || searchTerm) && (
                    <button
                        onClick={clearFilters}
                        style={{
                            background: 'transparent',
                            border: '1px solid #ef4444',
                            color: '#ef4444',
                            borderRadius: '8px',
                            padding: '0 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.9rem'
                        }}
                    >
                        <X size={14} /> Clear
                    </button>
                )}
            </div>

        </div>
    );
}

// selectStyle removed as it is no longer used
