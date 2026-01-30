import { useParams, Link } from 'react-router-dom';
import { Star, Plus, Pencil, Play, ArrowLeft, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import useUserRole from '../hooks/useUserRole';

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

export default function GameDetails() {
    const { id } = useParams();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const { role } = useUserRole();

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Fetch Game Details
        fetch(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`)
            .then(res => res.json())
            .then(data => {
                setGame({
                    id: data.id,
                    title: data.name,
                    year: data.released ? data.released.substring(0, 4) : 'N/A',
                    rating: data.rating,
                    image: data.background_image,
                    genres: data.genres ? data.genres.map(g => g.name) : [],
                    description: data.description_raw || data.description,
                    platforms: data.platforms ? data.platforms.map(p => p.platform.name) : []
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        // Fetch Reviews
        fetchReviews();
    }, [id]);

    const fetchReviews = async () => {
        try {
            const q = query(
                collection(db, "reviews"),
                where("gameId", "==", Number(id)),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const loadedReviews = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setReviews(loadedReviews);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    const handleDelete = async (reviewId) => {
        const confirmDelete = window.confirm("Delete this review?");
        if (!confirmDelete) return;

        try {
            console.log("Deleting review:", reviewId);
            if (!reviewId) throw new Error("Review ID is missing");
            await deleteDoc(doc(db, "reviews", reviewId));
            alert("Review deleted");
            // Optimistically remove from UI
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (err) {
            console.error("Delete failed:", err);
            alert(`Failed to delete review: ${err.message}`);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!newReview.trim()) return;

        if (!auth.currentUser) {
            alert("Please sign in to post a review");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, "reviews"), {
                gameId: Number(id),
                gameTitle: game.title,
                rating: Number(rating),
                review: newReview,
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || "Anonymous",
                userPhoto: auth.currentUser.photoURL,
                gameCover: game.image, // Save game cover for profile display
                createdAt: Timestamp.now()
            });

            setNewReview('');
            setRating(5);
            fetchReviews(); // Refresh list
        } catch (error) {
            console.error("Error adding review:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h1>Loading details...</h1>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
                <h1>Game not found</h1>
                <Link to="/browse" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
                    Back to Browse
                </Link>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '80px', paddingBottom: '100px', position: 'relative' }}>

            <Link to="/browse" style={{
                position: 'absolute',
                top: '100px',
                left: '40px',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '10px 20px',
                borderRadius: '30px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textDecoration: 'none',
                fontWeight: 500,
                cursor: 'pointer'
            }}>
                <ArrowLeft size={20} /> Back
            </Link>

            {/* Banner / Cover */}
            <div style={{
                height: '400px',
                position: 'relative',
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
            }}>
                <img
                    src={game.image}
                    alt={game.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }}
                />
            </div>

            <div className="container" style={{ marginTop: '-150px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>

                    {/* Poster Card */}
                    <div className="glass-card" style={{
                        width: '250px',
                        height: '350px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <img
                            src={game.image}
                            alt={game.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, paddingTop: '50px' }}>


                        <h1 style={{ fontSize: '3.5rem', lineHeight: '1', marginBottom: '0.5rem' }}>{game.title}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                            <span>{game.year}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                                <Star fill="#fbbf24" size={20} /> {game.rating}
                            </span>
                            <span>{game.genres.join(', ')}</span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                            <ActionButton icon={<Star size={20} />} label="Rate" />
                            <ActionButton icon={<Pencil size={20} />} label="Review" />
                            <ActionButton icon={<Plus size={20} />} label="Add to Library" active />
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Synposis</h3>
                            <p style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                                {game.description}
                            </p>
                            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <span style={{ color: 'var(--text-muted)', marginRight: '1rem' }}>Platforms:</span>
                                {game.platforms.map(p => (
                                    <span key={p} style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        marginRight: '8px',
                                        fontSize: '0.9rem'
                                    }}>
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div style={{ marginBottom: '4rem' }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Reviews</h2>

                            {/* Add Review Form */}
                            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Write a Review</h3>
                                <form onSubmit={handleSubmitReview}>
                                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span>Rating:</span>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star
                                                    key={star}
                                                    size={24}
                                                    style={{ cursor: 'pointer' }}
                                                    fill={star <= rating ? "#fbbf24" : "none"}
                                                    color={star <= rating ? "#fbbf24" : "var(--text-muted)"}
                                                    onClick={() => setRating(star)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        value={newReview}
                                        onChange={e => setNewReview(e.target.value)}
                                        placeholder="Share your thoughts..."
                                        style={{
                                            width: '100%',
                                            minHeight: '100px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            color: 'white',
                                            marginBottom: '1rem',
                                            fontSize: '1rem',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-primary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
                                    >
                                        <Send size={18} /> {submitting ? 'Posting...' : 'Post Review'}
                                    </button>
                                </form>
                            </div>

                            {/* Reviews List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {reviews.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No reviews yet. Be the first to review!</p>
                                ) : (
                                    reviews.map(review => (
                                        <div key={review.id} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    <Link to={`/profile/${review.userId}`} style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                                                        {review.userName}
                                                    </Link>
                                                </span>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={14} fill={i < review.rating ? "#fbbf24" : "none"} color={i < review.rating ? "#fbbf24" : "gray"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>{review.review}</p>
                                            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <span>{review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>

                                                {(role === "admin" || auth.currentUser?.uid === review.userId) && (
                                                    <button
                                                        onClick={() => handleDelete(review.id)}
                                                        style={{
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
}

function ActionButton({ icon, label, active }) {
    return (
        <button style={{
            background: active ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            color: active ? 'white' : 'var(--text-main)',
            border: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            transition: '0.2s'
        }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            {icon} {label}
        </button>
    );
}
