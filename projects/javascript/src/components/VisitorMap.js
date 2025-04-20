import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/VisitorMapComponent.css';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * VisitorMap Component
 * 
 * Displays a map showing visitor locations using the Google Maps API.
 * Fetches visitor location data from the server and plots markers on the map.
 * Includes a loading state while data is being fetched.
 * 
 * @returns {JSX.Element} The rendered visitor map component
 */
const VisitorMap = () => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchVisitors();
    }, []);

    const fetchVisitors = async () => {
        try {
            const response = await fetch('/visitor-locations.php');
            const data = await response.json();
            
            if (data.success) {
                setVisitors(data.data);
            } else {
                setError(data.error || 'Failed to fetch visitor data');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="visitor-map-loading">Loading visitor map...</div>;
    }

    if (error) {
        return <div className="visitor-map-error">{error}</div>;
    }

    return (
        <div className="visitor-map-container">
            <MapContainer
                center={[20, 0]}
                zoom={2}
                className="visitor-map"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {visitors.map((visitor, index) => (
                    <Marker
                        key={index}
                        position={[visitor.latitude, visitor.longitude]}
                        className="visitor-map-marker"
                    >
                        <Popup className="visitor-map-tooltip">
                            <div className="visitor-map-tooltip-title">
                                {visitor.country}
                            </div>
                            <div className="visitor-map-tooltip-content">
                                <p>Visits: {visitor.count}</p>
                                <p>First Visit: {new Date(visitor.firstVisit).toLocaleDateString()}</p>
                                <p>Last Visit: {new Date(visitor.lastVisit).toLocaleDateString()}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default VisitorMap; 