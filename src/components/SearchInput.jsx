import React, { useState, useCallback } from 'react';
import { throttle } from 'lodash'; // Using lodash for a reliable implementation

export const SearchComponent = () => {
  const [query, setQuery] = useState('');

  // 1. Define the throttled function
  // Memoize it so it persists across renders
  const throttledSearch = useCallback(
    throttle((searchTerm) => {
      console.log('Executing search for:', searchTerm);
      // Perform API call or filtering here
    }, 1000), // Limits execution to once every 1000ms
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // 2. Call the throttled version of the search
    throttledSearch(value);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Type to search..."
      />
      <p>Current state: {query}</p>
    </div>
  );
};
