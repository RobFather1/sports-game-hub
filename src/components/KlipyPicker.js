/**
 * KlipyPicker Component
 *
 * PURPOSE: Modal overlay for searching and selecting sports clips and GIFs
 * from the Klipy API. Users can browse trending content or search by keyword.
 *
 * FEATURES:
 * - Shows trending sports content when first opened
 * - Debounced search (500ms delay to prevent API spam)
 * - Responsive grid layout (150px columns, scales on mobile)
 * - Lazy loading for images
 * - Keyboard accessible (Escape to close, Enter to search)
 * - Loading, error, and empty states
 *
 * PROPS:
 * - isOpen: Boolean to show/hide modal
 * - onClose: Function to call when modal should close
 * - onSelectContent: Function called when user selects a GIF/clip
 *   Parameters: (url, alt, width, height)
 */

import { useState, useEffect, useRef } from 'react';
import { searchContent, getTrendingContent } from '../services/klipyService';

function KlipyPicker({ isOpen, onClose, onSelectContent }) {
  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Content results from Klipy API
  const [contentItems, setContentItems] = useState([]);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce timer reference
  const debounceTimerRef = useRef(null);

  /**
   * Load trending content when modal first opens
   */
  useEffect(() => {
    if (isOpen && contentItems.length === 0) {
      loadTrendingContent();
    }
  }, [isOpen]);

  /**
   * Debounced search effect
   * Waits 500ms after user stops typing before searching
   */
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search on empty query - show trending instead
    if (searchQuery.trim() === '') {
      loadTrendingContent();
      return;
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    // Cleanup on unmount or query change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  /**
   * Load trending content from Klipy
   */
  const loadTrendingContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading trending Klipy content...');
      const results = await getTrendingContent();
      setContentItems(results);
      console.log('Loaded', results.length, 'trending items');
    } catch (err) {
      console.error('Error loading trending content:', err);
      setError('Failed to load trending content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Search Klipy content by query
   */
  const performSearch = async (query) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Searching Klipy for:', query);
      const results = await searchContent(query);
      setContentItems(results);
      console.log('Found', results.length, 'results for:', query);
    } catch (err) {
      console.error('Error searching content:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  /**
   * Handle content selection
   */
  const handleSelectContent = (item) => {
    console.log('Content selected:', item.title);
    onSelectContent(item.url, item.title, item.width, item.height);
  };

  /**
   * Handle Escape key to close modal
   */
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  /**
   * Handle overlay click (close modal)
   */
  const handleOverlayClick = (event) => {
    // Only close if clicking the overlay itself, not the modal content
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  /**
   * Reset state when modal closes
   */
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setContentItems([]);
      setError(null);
    }
  }, [isOpen]);

  // Don't render if modal is closed
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div className="gif-picker-modal">
        {/* HEADER */}
        <div className="gif-picker-header">
          <h2 className="modal-title">Search Sports Clips & GIFs</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="gif-search-container">
          <input
            type="text"
            className="gif-search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search KLIPY"
            autoFocus
          />
        </div>

        {/* CONTENT GRID */}
        <div className="gif-grid-container">
          {/* Loading State */}
          {isLoading && (
            <div className="gif-loading">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="gif-error">
              <p>{error}</p>
              <button
                className="retry-button"
                onClick={loadTrendingContent}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && contentItems.length === 0 && (
            <div className="gif-empty">
              <p>No results found</p>
              <p className="gif-empty-hint">Try a different search term</p>
            </div>
          )}

          {/* Content Grid */}
          {!isLoading && !error && contentItems.length > 0 && (
            <div className="gif-grid">
              {contentItems.map((item) => (
                <div
                  key={item.id}
                  className="gif-item"
                  onClick={() => handleSelectContent(item)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${item.title}`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSelectContent(item);
                    }
                  }}
                >
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    className="gif-preview"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER - Attribution */}
        <div className="gif-picker-footer">
          <p className="klipy-attribution">Powered by KLIPY</p>
        </div>
      </div>
    </div>
  );
}

export default KlipyPicker;
