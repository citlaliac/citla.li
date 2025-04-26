import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/KaraokePage.css';

function KaraokePage() {
    const [songs, setSongs] = useState([]);
    const [songId, setSongId] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updateMessage, setUpdateMessage] = useState('');

    // Fetch songs on component mount
    useEffect(() => {
        fetchSongs();
    }, []);

    const fetchSongs = async () => {
        try {
            const response = await fetch('https://citla.li/karaoke-songs.php');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch songs');
            }

            setSongs(data.songs);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setUpdateMessage('');

        try {
            const response = await fetch('https://citla.li/karaoke-songs.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ songId: parseInt(songId) })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to update song');
            }

            setUpdateMessage('Song marked as played!');
            setSongId('');
            // Refresh the song list
            fetchSongs();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="karaoke-page">
            <Header />
            <div className="karaoke-content">
                <div className="karaoke-form-container">
                    <h2 className="karaoke-title">karaoke song list</h2>
                    
                    {/* Song played form */}
                    <form onSubmit={handleSubmit} className="karaoke-form">
                        <div className="karaoke-form-group">
                            <input
                                type="number"
                                value={songId}
                                onChange={(e) => setSongId(e.target.value)}
                                placeholder="Enter a song ID"
                                className="karaoke-input"
                                required
                            />
                            <button type="submit" className="karaoke-submit-button">
                                Mark as Played
                            </button>
                        </div>
                        {error && <div className="karaoke-error">{error}</div>}
                        {updateMessage && <div className="karaoke-success">{updateMessage}</div>}
                    </form>

                    {/* Songs table */}
                    {loading ? (
                        <div className="karaoke-loading">Loading songs...</div>
                    ) : (
                        <div className="karaoke-table-container">
                            <table className="karaoke-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Song Title</th>
                                        <th>Artist</th>
                                        <th>Last Played</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {songs.map(song => {
                                        const lastPlayed = song.last_played ? new Date(song.last_played) : null;
                                        // Subtract 4 hours from UTC to get ET
                                        const lastPlayedET = lastPlayed ? new Date(lastPlayed.getTime() - (4 * 60 * 60 * 1000)) : null;
                                        const isRecentlyPlayed = lastPlayed && 
                                            (Date.now() - lastPlayed.getTime()) <= (24 * 60 * 60 * 1000);
                                        
                                        return (
                                            <tr key={song.id}>
                                                <td>{song.id}</td>
                                                <td style={{ textDecoration: isRecentlyPlayed ? 'line-through' : 'none' }}>
                                                    {song.song_title}
                                                </td>
                                                <td style={{ textDecoration: isRecentlyPlayed ? 'line-through' : 'none' }}>
                                                    {song.artist}
                                                </td>
                                                <td>
                                                    {lastPlayedET ? lastPlayedET.toLocaleString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    }) : 'Never'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default KaraokePage; 