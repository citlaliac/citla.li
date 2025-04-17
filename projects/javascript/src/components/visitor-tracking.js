// Simple visitor tracking
const trackVisitor = async () => {
    try {
        console.log('Starting visitor tracking...');
        console.log('Current URL:', window.location.href);
        
        const requestBody = {
            page_url: window.location.href
        };
        console.log('Request body:', requestBody);
        
        console.log('Making request to:', '/track-visitor.php');
        const response = await fetch('/track-visitor.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (!data.success) {
            console.error('API returned error:', data.error);
            throw new Error(data.error || 'Failed to track visitor');
        }
        
        console.log('Successfully tracked visitor');
    } catch (error) {
        console.error('Error in trackVisitor:', error);
        console.error('Error stack:', error.stack);
    }
};

// Track on page load
console.log('Initializing visitor tracking...');
trackVisitor(); 