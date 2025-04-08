// Track visitor information
async function trackVisitor() {
  try {
    
    const response = await fetch('track-visitor.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_url: window.location.href
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

// Track visitor when page loads
document.addEventListener('DOMContentLoaded', trackVisitor); 