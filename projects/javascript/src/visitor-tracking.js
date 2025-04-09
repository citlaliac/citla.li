// Track visitor information
async function trackVisitor(url = window.location.href) {
  try {
    console.log('Tracking visit to:', url);
    
    const response = await fetch('/track-visitor.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_url: url
      })
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Failed to track visitor. Response:', text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('Tracking failed:', data.error);
    }
  } catch (error) {
    console.error('Error tracking visitor:', error);
  }
}

// Initialize tracking
export function initializeTracking() {
  // Track initial page load
  trackVisitor();

  // Track navigation changes
  if (typeof window !== 'undefined') {
    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', () => {
      trackVisitor(window.location.href);
    });

    // Create a modified history.pushState function
    const originalPushState = window.history.pushState;
    window.history.pushState = function() {
      originalPushState.apply(this, arguments);
      trackVisitor(window.location.href);
    };

    // Create a modified history.replaceState function
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      trackVisitor(window.location.href);
    };
  }
}

// Export the tracking function for manual use if needed
export { trackVisitor }; 