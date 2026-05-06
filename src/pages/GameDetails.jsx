import { useParams, Link } from 'react-router-dom';
import { Star, Plus, Send, Swords, Map, TrendingUp, Eye, Award, Gamepad2, ExternalLink, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase/config';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import useUserRole from '../hooks/useUserRole';
import { SteamIcon, XboxIcon, PlaystationIcon, EpicGamesIcon, NintendoIcon, GOGIcon } from '../components/StoreIcons';
import steamLogo from '../assets/512x512-logo-27129.png';
import xboxLogo from '../assets/xbox-logo-png-2492.png';
import psLogo from '../assets/playstation-logo-png_seeklogo-347961.png';
import nintendoLogo from '../assets/nintendo-7786.png';
import gogLogo from '../assets/gog-games-logo.png';
import { getSteamAppId } from '../utils/steamUtils';
import { Play } from 'lucide-react';

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

// Generate dynamic tagline based on game genres
const generateTagline = (genres, title) => {
    const genreNames = genres.map(g => g.toLowerCase());

    const taglines = {
        action: [
            "Prepare for pulse-pounding action and intense combat.",
            "An adrenaline-fueled adventure awaits.",
            "Experience explosive action and heart-racing moments."
        ],
        adventure: [
            "Embark on an unforgettable journey of discovery.",
            "An epic adventure through unknown worlds.",
            "Explore, discover, and conquer new horizons."
        ],
        rpg: [
            "Forge your own destiny in an immersive world.",
            "Your choices shape the story that unfolds.",
            "A tale of heroism, sacrifice, and legendary quests."
        ],
        strategy: [
            "Outwit your enemies with tactical brilliance.",
            "Command your forces and dominate the battlefield.",
            "Every decision matters in this strategic masterpiece."
        ],
        shooter: [
            "Lock and load for intense firefights.",
            "Precision, reflexes, and skill define the victor.",
            "The battlefield calls. Will you answer?"
        ],
        puzzle: [
            "Challenge your mind with intricate puzzles.",
            "Think outside the box to unlock the truth.",
            "Logic and creativity merge in this brain-teaser."
        ],
        horror: [
            "Confront your deepest fears in the shadows.",
            "Terror lurks around every corner.",
            "Survive the nightmare, if you dare."
        ],
        simulation: [
            "Experience life from a whole new perspective.",
            "Build, manage, and master your domain.",
            "Reality meets imagination in stunning detail."
        ]
    };

    // Find matching genre taglines
    for (const [genre, lines] of Object.entries(taglines)) {
        if (genreNames.some(g => g.includes(genre))) {
            return lines[Math.floor(Math.random() * lines.length)];
        }
    }

    // Default taglines for unmatched genres
    const defaults = [
        "An unforgettable gaming experience awaits.",
        "Enter a world where legends are born.",
        "Immerse yourself in a masterpiece of interactive entertainment.",
        "A journey that will leave its mark."
    ];

    return defaults[title.length % defaults.length];
};

// Generate dynamic gameplay overview based on game data
const generateGameplayOverview = (genres, tags) => {
    const genreNames = genres.map(g => g.toLowerCase());
    const tagNames = tags.map(t => t.toLowerCase());

    // Combat Style
    let combatStyle = 'Action';
    if (tagNames.some(t => t.includes('tactical') || t.includes('strategy'))) combatStyle = 'Tactical';
    else if (tagNames.some(t => t.includes('stealth'))) combatStyle = 'Stealth';
    else if (genreNames.some(g => g.includes('shooter'))) combatStyle = 'Shooter';
    else if (tagNames.some(t => t.includes('hack and slash'))) combatStyle = 'Hack & Slash';
    else if (genreNames.some(g => g.includes('fighting'))) combatStyle = 'Fighting';
    else if (genreNames.some(g => g.includes('puzzle'))) combatStyle = 'Puzzle-Based';

    // Exploration
    let exploration = 'Linear';
    if (tagNames.some(t => t.includes('open world') || t.includes('sandbox'))) exploration = 'Open World';
    else if (tagNames.some(t => t.includes('exploration'))) exploration = 'Exploration';
    else if (tagNames.some(t => t.includes('metroidvania'))) exploration = 'Metroidvania';
    else if (genreNames.some(g => g.includes('adventure'))) exploration = 'Adventure';

    // Progression
    let progression = 'Level-Based';
    if (tagNames.some(t => t.includes('rpg') || t.includes('character customization'))) progression = 'Skill Trees';
    else if (tagNames.some(t => t.includes('roguelike') || t.includes('roguelite'))) progression = 'Roguelike';
    else if (genreNames.some(g => g.includes('rpg'))) progression = 'RPG System';
    else if (tagNames.some(t => t.includes('choices matter'))) progression = 'Choice-Driven';

    // Camera
    let camera = 'Third Person';
    if (tagNames.some(t => t.includes('first-person') || t.includes('fps'))) camera = 'First Person';
    else if (tagNames.some(t => t.includes('top-down') || t.includes('isometric'))) camera = 'Top-Down';
    else if (tagNames.some(t => t.includes('side scroller') || t.includes('2d'))) camera = 'Side-Scrolling';
    else if (genreNames.some(g => g.includes('platformer'))) camera = '2D Platformer';

    return { combatStyle, exploration, progression, camera };
};

// Clean description to remove non-English text
const cleanDescription = (description) => {
    if (!description) return '';

    // Common patterns that indicate start of non-English content
    const languageMarkers = [
        /Español[:\s]/i,
        /Français[:\s]/i,
        /Deutsch[:\s]/i,
        /Italiano[:\s]/i,
        /Português[:\s]/i,
        /Русский[:\s]/i,
        /日本語[:\s]/i,
        /中文[:\s]/i,
        /한국어[:\s]/i
    ];

    let cleaned = description;

    // Find the earliest language marker and cut everything after it
    languageMarkers.forEach(marker => {
        const match = cleaned.match(marker);
        if (match) {
            cleaned = cleaned.substring(0, match.index).trim();
        }
    });

    return cleaned;
};

// Component for rendering individual spoiler text blocks
const SpoilerText = ({ text }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <span
            onClick={() => setIsRevealed(!isRevealed)}
            style={{
                cursor: 'pointer',
                background: isRevealed ? 'rgba(255, 255, 255, 0.1)' : '#000000',
                color: isRevealed ? 'inherit' : '#aaaaaa',
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'all 0.2s',
                border: '1px solid rgba(255,255,255,0.1)',
                userSelect: isRevealed ? 'auto' : 'none',
                fontSize: isRevealed ? 'inherit' : '0.9em',
                fontStyle: isRevealed ? 'normal' : 'italic'
            }}
            title={isRevealed ? "Click to hide spoiler" : "Click to reveal spoiler"}
        >
            {isRevealed ? text : "Click here to know the spoiler"}
        </span>
    );
};

// Helper function to parse review text and render SpoilerText components
const renderReviewText = (text) => {
    if (!text) return null;

    // Split the text by || to find spoilers. 
    // Example: "This is ||a secret||" -> ["This is ", "a secret", ""]
    // Every odd index in the resulting array will be a spoiler text
    const parts = text.split(/\|\|(.*?)\|\|/g);

    return parts.map((part, i) => {
        // Odd indices are the captured spoiler groups
        if (i % 2 === 1) {
            return <SpoilerText key={i} text={part} />;
        }
        // Even indices are normal text
        return <React.Fragment key={i}>{part}</React.Fragment>;
    });
};

export default function GameDetails() {
    const { id } = useParams();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const { role, user } = useUserRole();

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState('');
    const [rating, setRating] = useState(5);
    const [userRating, setUserRating] = useState(0);
    const [ratingsCount, setRatingsCount] = useState(0);
    const [allRatings, setAllRatings] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Edit Review State
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editReviewText, setEditReviewText] = useState('');
    const [editReviewRating, setEditReviewRating] = useState(5);

    const [showFullDescription, setShowFullDescription] = useState(false);
    const [inLibrary, setInLibrary] = useState(false);
    const [libraryStatus, setLibraryStatus] = useState(null);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [screenshots, setScreenshots] = useState([]);
    const [activeImage, setActiveImage] = useState(null);
    const [steamPlaytime, setSteamPlaytime] = useState(null);

    useEffect(() => {
        // Fetch Game Details and Stores in parallel
        Promise.all([
            fetch(`/api/rawg/games/${id}?key=${API_KEY}`).then(res => res.json()),
            fetch(`/api/rawg/games/${id}/stores?key=${API_KEY}`)
                .then(res => res.json())
                .catch(() => ({ results: [] }))
        ])
            .then(([data, storesData]) => {
                // Merge actual store URLs into data
                const actualStores = data.stores ? data.stores.map(s => {
                    const matchingStore = storesData.results?.find(sd => sd.store_id === s.store.id);
                    return matchingStore ? { ...s, url: matchingStore.url } : s;
                }) : [];

                setGame({
                    id: data.id,
                    title: data.name,
                    year: data.released ? data.released.substring(0, 4) : 'N/A',
                    rating: data.rating,
                    image: data.background_image,
                    genres: data.genres ? data.genres.map(g => g.name) : [],
                    description: cleanDescription(data.description_raw || data.description),
                    platforms: data.platforms ? data.platforms.map(p => p.platform.name) : [],
                    developers: data.developers ? data.developers.map(d => d.name) : [],
                    tags: data.tags ? data.tags.map(t => t.name) : [],
                    esrb_rating: data.esrb_rating?.name || 'Not Rated',
                    playtime: data.playtime,
                    stores: actualStores
                });
                setLoading(false);
            })
            .catch(err => {
                console.error("Game Details Fetch Error:", err);
                setLoading(false);
            });

        fetchReviews();
        fetchRatingsCount();

        // Fetch Screenshots
        const fetchScreenshots = async () => {
            try {
                const res = await fetch(`/api/rawg/games/${id}/screenshots?key=${API_KEY}`);
                const data = await res.json();
                setScreenshots(data.results || []);
            } catch (error) {
                console.error('Screenshot fetch error:', error);
            }
        };
        fetchScreenshots();

        // Fetch User's Rating and Library Status
        if (user) {
            fetchUserRating();
            checkLibraryStatus();
        }
    }, [id, user]);

    const fetchRatingsCount = async () => {
        try {
            const q = query(
                collection(db, "ratings"),
                where("gameId", "==", Number(id))
            );
            const snapshot = await getDocs(q);
            setRatingsCount(snapshot.size);
            // Store all standalone ratings for average calculation
            setAllRatings(snapshot.docs.map(d => d.data().rating));
        } catch (error) {
            console.error("Error fetching ratings count:", error);
        }
    };

    const fetchUserRating = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(db, "ratings"),
                where("userId", "==", user.uid),
                where("gameId", "==", Number(id))
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const rating = snapshot.docs[0].data().rating;
                console.log("User rating found:", rating);
                setUserRating(rating);
            } else {
                console.log("No user rating found");
                setUserRating(0);
            }
        } catch (error) {
            console.error("Error fetching user rating:", error);
        }
    };

    const checkLibraryStatus = async () => {
        if (!user) return;
        try {
            // Check manual library status
            const libQ = query(
                collection(db, "library"),
                where("userId", "==", user.uid),
                where("gameId", "==", Number(id))
            );
            const libSnap = await getDocs(libQ);
            if (!libSnap.empty) {
                setInLibrary(true);
                setLibraryStatus(libSnap.docs[0].data().status || 'Playing');
            } else {
                setInLibrary(false);
                setLibraryStatus(null);
            }

            // Check Steam library status
            const currentSteamAppId = getSteamAppId(game?.stores || []);
            if (currentSteamAppId) {
                const steamQ = query(
                    collection(db, "library"),
                    where("userId", "==", user.uid),
                    where("steamAppId", "==", Number(currentSteamAppId))
                );
                const steamSnap = await getDocs(steamQ);
                if (!steamSnap.empty) {
                    setSteamPlaytime(steamSnap.docs[0].data().playtime);
                }
            }
        } catch (error) {
            console.error("Error checking library status:", error);
        }
    };

    const handleToggleLibrary = async () => {
        if (!auth.currentUser) {
            alert("Please sign in to add games to your library");
            return;
        }
        setShowStatusMenu(!showStatusMenu);
    };

    const handleStatusSelect = async (newStatus) => {
        if (!auth.currentUser) return;

        try {
            const q = query(
                collection(db, "library"),
                where("userId", "==", auth.currentUser.uid),
                where("gameId", "==", Number(id))
            );
            const snapshot = await getDocs(q);

            if (newStatus === 'Remove') {
                if (!snapshot.empty) {
                    await deleteDoc(doc(db, "library", snapshot.docs[0].id));
                    setInLibrary(false);
                    setLibraryStatus(null);
                }
            } else {
                if (!snapshot.empty) {
                    // Update existing
                    await updateDoc(doc(db, "library", snapshot.docs[0].id), {
                        status: newStatus,
                        updatedAt: Timestamp.now()
                    });
                } else {
                    // Create new
                    await addDoc(collection(db, "library"), {
                        userId: auth.currentUser.uid,
                        gameId: Number(id),
                        gameTitle: game.title,
                        gameImage: game.image || 'https://via.placeholder.com/300x400?text=No+Image',
                        status: newStatus,
                        addedAt: Timestamp.now()
                    });
                    setInLibrary(true);
                }
                setLibraryStatus(newStatus);
            }
            setShowStatusMenu(false);
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Error updating library: " + error.message);
        }
    };

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

            // Fetch the GameHive profile name for each reviewer
            const enhancedReviews = await Promise.all(loadedReviews.map(async (review) => {
                if (review.userId) {
                    try {
                        const userRef = doc(db, "users", review.userId);
                        const userSnap = await getDoc(userRef);
                        if (userSnap.exists() && userSnap.data().name) {
                            review.userName = userSnap.data().name;
                        }
                    } catch (err) {
                        console.error("Error fetching user data for review", err);
                    }
                }
                return review;
            }));

            setReviews(enhancedReviews);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    const handleDelete = async (reviewId) => {
        const confirmDelete = window.confirm("Delete this review?");
        if (!confirmDelete) return;

        try {
            if (!reviewId) throw new Error("Review ID is missing");
            await deleteDoc(doc(db, "reviews", reviewId));
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (err) {
            console.error("Delete failed:", err);
            alert(`Failed to delete review: ${err.message}`);
        }
    };

    const handleReport = async (review) => {
        if (!auth.currentUser) {
            alert("Please sign in to report a review.");
            return;
        }

        if (auth.currentUser.uid === review.userId) {
            alert("You cannot report your own review.");
            return;
        }

        const confirmReport = window.confirm("Are you sure you want to report this review for spam or abusive content?");
        if (!confirmReport) return;

        try {
            await addDoc(collection(db, "reported_reviews"), {
                reviewId: review.id,
                gameId: Number(id),
                gameTitle: game.title,
                reviewText: review.review,
                authorId: review.userId,
                authorName: review.userName,
                reporterId: auth.currentUser.uid,
                reporterName: auth.currentUser.displayName || "Anonymous",
                status: 'pending',
                createdAt: Timestamp.now()
            });
            alert("Review reported successfully. Admins will review it shortly.");
        } catch (error) {
            console.error("Error reporting review:", error);
            alert("Failed to report review.");
        }
    };

    const handleQuickRate = async (selectedRating) => {
        if (!auth.currentUser) {
            alert("Please sign in to rate this game");
            return;
        }

        try {
            // Check if user already rated
            const q = query(
                collection(db, "ratings"),
                where("userId", "==", auth.currentUser.uid),
                where("gameId", "==", Number(id))
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                // Update existing rating
                const ratingDoc = doc(db, "ratings", snapshot.docs[0].id);
                await updateDoc(ratingDoc, {
                    rating: selectedRating,
                    updatedAt: Timestamp.now()
                });
            } else {
                // Create new rating
                await addDoc(collection(db, "ratings"), {
                    userId: auth.currentUser.uid,
                    gameId: Number(id),
                    rating: selectedRating,
                    createdAt: Timestamp.now()
                });
            }

            setUserRating(selectedRating);
            // Refresh ratings count
            fetchRatingsCount();
        } catch (error) {
            console.error("Error saving rating:", error);
            alert(`Failed to save rating: ${error.message}\n\nThis might be a Firestore permissions issue. Check the console for details.`);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

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
                gameCover: game.image,
                createdAt: Timestamp.now()
            });

            setNewReview('');
            setRating(5);
            fetchReviews();
        } catch (error) {
            console.error("Error adding review:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (review) => {
        setEditingReviewId(review.id);
        setEditReviewText(review.review);
        setEditReviewRating(review.rating);
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setEditReviewText('');
        setEditReviewRating(5);
    };

    const handleUpdateReview = async (e) => {
        e.preventDefault();

        if (!editingReviewId) return;

        setSubmitting(true);
        try {
            const reviewRef = doc(db, "reviews", editingReviewId);
            await updateDoc(reviewRef, {
                review: editReviewText,
                rating: editReviewRating,
                updatedAt: Timestamp.now()
            });

            setEditingReviewId(null);
            fetchReviews();
        } catch (error) {
            console.error("Error updating review:", error);
            alert("Failed to update review.");
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

    // Calculate average from both reviews AND standalone ratings
    const allRatingValues = [
        ...reviews.map(r => r.rating),
        ...allRatings
    ];
    const avgRating = allRatingValues.length > 0
        ? (allRatingValues.reduce((sum, r) => sum + r, 0) / allRatingValues.length).toFixed(1)
        : game.rating;

    const themeTags = ['Destiny', 'Choice', 'Morality', 'Survival'];
    const featuredReviews = reviews.slice(0, 2);
    const gameplayData = generateGameplayOverview(game.genres, game.tags || []);

    // Debug logging
    console.log("Debug - User Rating:", userRating);
    console.log("Debug - Auth User:", auth.currentUser?.uid);
    return (
        <div style={{ paddingTop: '80px', paddingBottom: '100px', position: 'relative' }}>

            {/* Banner with Gradient Overlay */}
            <div style={{
                height: '500px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <img
                    src={game.image}
                    alt={game.title}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.4)'
                    }}
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, var(--bg-dark) 0%, transparent 60%)'
                }} />
            </div>

            {/* Main layout: sticky poster sidebar + scrollable content */}
            <div className="container" style={{ marginTop: '-220px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

                    {/* Sticky sidebar – floating poster + store icons */}
                    <div style={{
                        width: '220px',
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        position: 'sticky',
                        top: '90px',
                        alignSelf: 'flex-start',
                        zIndex: 20
                    }}>
                        <div style={{
                            borderRadius: '14px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <img
                                src={game.image}
                                alt={game.title}
                                style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
                            />
                        </div>

                        {/* Store Icons */}
                        {game.stores && game.stores.length > 0 && (
                            <div style={{
                                display: 'flex',
                                flexWrap: 'nowrap',
                                gap: '6px',
                                justifyContent: 'center'
                            }}>
                                {game.stores.map((storeObj) => {
                                    const storeId = storeObj.store.id;
                                    const storeName = storeObj.store.name;
                                    const url = storeObj.url;

                                    let bg = 'rgba(23, 26, 33, 0.9)';
                                    let icon = null;

                                    const glossyGradient = 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)';

                                    if (storeId === 1) {
                                        bg = '#171a21';
                                        icon = <img src={steamLogo} alt="Steam" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
                                    } else if (storeId === 3 || storeObj.store.slug === 'playstation-store') {
                                        bg = '#ffffff';
                                        icon = <img src={psLogo} alt="PlayStation" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
                                    } else if (storeId === 2 || storeObj.store.slug === 'xbox-store') {
                                        bg = '#107C10';
                                        icon = <img src={xboxLogo} alt="Xbox" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />;
                                    } else if (storeId === 11 || storeObj.store.slug === 'epic-games') {
                                        bg = '#2a2a2a';
                                        icon = <EpicGamesIcon size={20} />;
                                    } else if (storeId === 6 || storeName.includes('Nintendo')) {
                                        bg = '#e60012';
                                        icon = <img src={nintendoLogo} alt="Nintendo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />;
                                    } else if (storeId === 5 || storeObj.store.slug === 'gog') {
                                        bg = '#ffffff';
                                        icon = <img src={gogLogo} alt="GOG" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
                                    }

                                    if (!icon) {
                                        bg = 'rgba(255, 255, 255, 0.1)';
                                        icon = <Gamepad2 size={20} />;
                                    }

                                    return (
                                        <a
                                            key={storeId}
                                            href={(url && !url.startsWith('http')) ? (url.startsWith('/') ? `https://rawg.io${url}` : `https://${url}`) : url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={storeName}
                                            style={{
                                                background: `${glossyGradient}, ${bg}`,
                                                backgroundBlendMode: 'overlay, normal',
                                                borderTop: '1px solid rgba(255,255,255,0.5)',
                                                borderBottom: '1px solid rgba(0,0,0,0.2)',
                                                borderLeft: '1px solid rgba(255,255,255,0.1)',
                                                borderRight: '1px solid rgba(255,255,255,0.1)',
                                                padding: '8px',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                                backdropFilter: 'blur(10px)',
                                                width: '38px',
                                                height: '38px',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-3px) scale(1.1)';
                                                e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)';
                                                e.currentTarget.style.zIndex = 10;
                                                e.currentTarget.style.borderTop = '1px solid rgba(255,255,255,0.8)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
                                                e.currentTarget.style.zIndex = 1;
                                                e.currentTarget.style.borderTop = '1px solid rgba(255,255,255,0.5)';
                                            }}
                                        >
                                            {React.isValidElement(icon) ? icon : <Gamepad2 size={20} />}
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right scrollable content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Info card – title/info only (poster is in sticky sidebar) */}
                        <div className="glass-card" style={{ padding: '2rem 2.5rem', marginBottom: '2rem', position: 'relative', zIndex: 50, overflow: 'visible' }}>
                            <h1 style={{ fontSize: '3rem', lineHeight: '1.1', marginBottom: '0.75rem' }}>
                                {game.title}
                            </h1>
                            <p style={{
                                fontSize: '1.1rem',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                                marginBottom: '1.5rem',
                                borderLeft: '3px solid var(--primary)',
                                paddingLeft: '1rem'
                            }}>
                                {generateTagline(game.genres, game.title)}
                            </p>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2rem',
                                marginBottom: '1.5rem',
                                fontSize: '1.05rem',
                                color: 'var(--text-muted)'
                            }}>
                                <span>{game.year}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                                    <Star fill="#fbbf24" size={20} /> {game.rating}
                                </span>
                                <span>{game.genres.slice(0, 2).join(', ')}</span>
                            </div>

                            {/* Quick Rating */}
                            <div style={{
                                marginBottom: '1.5rem',
                                paddingBottom: '1.5rem',
                                borderBottom: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '0.5rem'
                                }}>
                                    <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                                        {userRating > 0 ? 'Your Rating:' : 'Rate this game:'}
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star
                                                key={star}
                                                size={24}
                                                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                fill={star <= userRating ? "#fbbf24" : "none"}
                                                color={star <= userRating ? "#fbbf24" : "var(--text-muted)"}
                                                onClick={() => handleQuickRate(star)}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'scale(1.15)';
                                                    e.currentTarget.style.color = '#fbbf24';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.color = star <= userRating ? '#fbbf24' : 'var(--text-muted)';
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {userRating > 0 && (
                                        <span style={{ fontSize: '0.9rem', color: '#fbbf24', fontWeight: '600' }}>
                                            {userRating}/5
                                        </span>
                                    )}
                                </div>
                                {!auth.currentUser && (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        Sign in to rate this game
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 10 }}>
                                {getSteamAppId(game.stores) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button
                                            onClick={() => window.location.href = `steam://run/${getSteamAppId(game.stores)}`}
                                            style={{
                                                background: '#171a21',
                                                color: 'white',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                padding: '10px 20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = '#2a2e38';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = '#171a21';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <Play size={16} fill="white" /> Play on Steam
                                        </button>
                                        <a 
                                            href={`https://store.steampowered.com/app/${getSteamAppId(game.stores)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                fontSize: '0.75rem',
                                                color: '#a1a1aa',
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                paddingLeft: '5px'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}
                                        >
                                            <ExternalLink size={12} /> View on Steam Store
                                        </a>
                                    </div>
                                )}
                                {steamPlaytime !== null && (
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        justifyContent: 'center',
                                        background: 'rgba(124,58,237,0.1)',
                                        border: '1px solid rgba(124,58,237,0.2)',
                                        borderRadius: '12px',
                                        padding: '0 15px'
                                    }}>
                                        <div style={{ fontSize: '0.8rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                                            <RefreshCw size={12} /> In Steam Library
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                                            ⏱ {steamPlaytime} hours played
                                        </div>
                                    </div>
                                )}
                                <div style={{ position: 'relative' }}>
                                    <SubtleButton
                                        icon={<Plus size={16} />}
                                        label={inLibrary ? libraryStatus : "Library"}
                                        active={inLibrary}
                                        onClick={handleToggleLibrary}
                                    />
                                    {showStatusMenu && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '8px',
                                            background: 'rgba(23, 23, 23, 0.98)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            padding: '8px',
                                            zIndex: 1000,
                                            minWidth: '180px',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                                        }}>
                                            {['Playing', 'Completed', 'Wishlist'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusSelect(status)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 15px',
                                                        textAlign: 'left',
                                                        background: libraryStatus === status ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                                                        color: libraryStatus === status ? '#7c3aed' : '#a1a1aa',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem',
                                                        transition: 'all 0.2s',
                                                        fontWeight: libraryStatus === status ? '600' : '500'
                                                    }}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                            {inLibrary && (
                                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 8px' }} />
                                            )}
                                            {inLibrary && (
                                                <button
                                                    onClick={() => handleStatusSelect('Remove')}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 15px',
                                                        textAlign: 'left',
                                                        background: 'transparent',
                                                        color: '#ef4444',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem',
                                                        transition: 'all 0.2s',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Story Section */}
                        <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '3rem', position: 'relative', zIndex: 10 }}>
                            <h3 style={{
                                fontSize: '0.9rem',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                color: 'var(--primary)',
                                marginBottom: '1.5rem',
                                fontWeight: '700'
                            }}>
                                Story
                            </h3>
                            <div style={{
                                borderLeft: '2px solid var(--primary)',
                                paddingLeft: '1.5rem'
                            }}>
                                <p style={{
                                    fontSize: '1.05rem',
                                    lineHeight: '2',
                                    color: '#e4e4e7',
                                    marginBottom: '1rem'
                                }}>
                                    {showFullDescription
                                        ? game.description
                                        : (game.description.length > 300
                                            ? game.description.substring(0, 300) + '...'
                                            : game.description)}
                                </p>
                                {game.description.length > 300 && (
                                    <button
                                        onClick={() => setShowFullDescription(!showFullDescription)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#a855f7',
                                            cursor: 'pointer',
                                            fontSize: '0.95rem',
                                            fontWeight: '600',
                                            padding: '0'
                                        }}
                                    >
                                        {showFullDescription ? '− Read Less' : '+ Read More'}
                                    </button>
                                )}
                            </div>

                            {/* Theme Tags */}
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {themeTags.map(tag => (
                                    <span key={tag} style={{
                                        background: 'rgba(168,85,247,0.15)',
                                        color: '#c084fc',
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        border: '1px solid rgba(168,85,247,0.3)'
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Gameplay Overview */}
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{
                                fontSize: '2rem',
                                marginBottom: '1.5rem',
                                fontWeight: '700'
                            }}>
                                Gameplay Overview
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '1rem'
                            }}>
                                <GameplayCard icon={<Swords size={24} />} label="Combat Style" value={gameplayData.combatStyle} />
                                <GameplayCard icon={<Map size={24} />} label="Exploration" value={gameplayData.exploration} />
                                <GameplayCard icon={<TrendingUp size={24} />} label="Progression" value={gameplayData.progression} />
                                <GameplayCard icon={<Eye size={24} />} label="Camera" value={gameplayData.camera} />
                            </div>
                        </div>

                        {/* Screenshot Gallery */}
                        {screenshots.length > 0 && (
                            <div className="screenshots-section">
                                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontWeight: '700' }}>Screenshots</h2>
                                <div className="screenshots-grid">
                                    {screenshots.map((shot) => (
                                        <img
                                            key={shot.id}
                                            src={shot.image}
                                            alt="Game screenshot"
                                            className="screenshot-img"
                                            onClick={() => setActiveImage(shot.image)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reviews Section */}
                        <div style={{ marginBottom: '4rem' }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontWeight: '700' }}>Reviews</h2>

                            {/* Review Summary */}
                            <div className="glass-card" style={{
                                padding: '2rem',
                                marginBottom: '2rem',
                                background: 'rgba(168,85,247,0.08)'
                            }}>
                                <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '3.5rem', fontWeight: '800', color: '#fbbf24' }}>
                                            {avgRating}
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '0.5rem', justifyContent: 'center' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={20}
                                                    fill={i < Math.round(avgRating) ? "#fbbf24" : "none"}
                                                    color="#fbbf24"
                                                />
                                            ))}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                            {reviews.length + ratingsCount} {(reviews.length + ratingsCount) === 1 ? 'Rating' : 'Ratings'}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                            {reviews.length > 0
                                                ? "Community feedback highlights engaging gameplay and immersive storytelling."
                                                : "Be the first to share your thoughts on this game!"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* User's Rating (if they rated but didn't review) */}
                            {auth.currentUser && userRating > 0 && !reviews.some(r => r.userId === auth.currentUser.uid) && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{
                                        marginBottom: '1rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontSize: '0.85rem'
                                    }}>
                                        Your Rating
                                    </h3>
                                    <div className="glass-card" style={{
                                        padding: '1.5rem',
                                        background: 'rgba(168,85,247,0.1)',
                                        border: '1px solid rgba(168,85,247,0.3)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span style={{ fontWeight: '600', fontSize: '1.05rem', color: '#c084fc' }}>
                                                You rated this game
                                            </span>
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        size={20}
                                                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                        fill={star <= userRating ? "#fbbf24" : "none"}
                                                        color={star <= userRating ? "#fbbf24" : "var(--text-muted)"}
                                                        onClick={() => handleQuickRate(star)}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.transform = 'scale(1.15)';
                                                            e.currentTarget.style.color = '#fbbf24';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                            e.currentTarget.style.color = star <= userRating ? '#fbbf24' : 'var(--text-muted)';
                                                        }}
                                                    />
                                                ))}
                                                <span style={{ marginLeft: '8px', fontSize: '0.95rem', color: '#fbbf24', fontWeight: '600' }}>
                                                    {userRating}/5
                                                </span>
                                            </div>
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                            Click the stars above to change your rating • Add a written review below to share more thoughts
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Featured Reviews */}
                            {featuredReviews.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{
                                        marginBottom: '1rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontSize: '0.85rem'
                                    }}>
                                        Most Helpful
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {featuredReviews.map(review => (
                                            <div key={review.id} className="glass-card" style={{
                                                padding: '1.5rem',
                                                background: 'rgba(255,255,255,0.03)'
                                            }}>
                                                {editingReviewId === review.id ? (
                                                    <form onSubmit={handleUpdateReview}>
                                                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>Rating:</span>
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <Star
                                                                        key={star}
                                                                        size={20}
                                                                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                                                        fill={star <= editReviewRating ? "#fbbf24" : "none"}
                                                                        color={star <= editReviewRating ? "#fbbf24" : "var(--text-muted)"}
                                                                        onClick={() => setEditReviewRating(star)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <textarea
                                                            value={editReviewText}
                                                            onChange={e => setEditReviewText(e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                minHeight: '80px',
                                                                background: 'rgba(255,255,255,0.05)',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                borderRadius: '8px',
                                                                padding: '1rem',
                                                                color: 'white',
                                                                marginBottom: '1rem',
                                                                fontSize: '0.95rem',
                                                                fontFamily: 'inherit',
                                                                lineHeight: '1.5'
                                                            }}
                                                        />
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={handleCancelEdit}
                                                                style={{
                                                                    background: 'transparent',
                                                                    color: 'var(--text-muted)',
                                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                                    padding: '6px 16px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                                                onMouseLeave={e => e.target.style.background = 'transparent'}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                disabled={submitting}
                                                                className="btn-primary"
                                                                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                                                            >
                                                                {submitting ? 'Saving...' : 'Save'}
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                            <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>
                                                                <Link
                                                                    to={`/profile/${review.userId}`}
                                                                    style={{ 
                                                                        color: 'inherit', 
                                                                        textDecoration: 'none',
                                                                        textTransform: 'capitalize',
                                                                        fontFamily: 'var(--font-heading)',
                                                                        letterSpacing: '0.5px'
                                                                    }}
                                                                    onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                                                                    onMouseLeave={e => e.target.style.color = 'inherit'}
                                                                >
                                                                    {review.userName || 'Anonymous'}
                                                                </Link>
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        size={14}
                                                                        fill={i < review.rating ? "#fbbf24" : "none"}
                                                                        color={i < review.rating ? "#fbbf24" : "gray"}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p style={{ color: '#e4e4e7', lineHeight: '1.7', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                                                            {renderReviewText(review.review)}
                                                        </p>
                                                        <div style={{
                                                            marginTop: '0.75rem',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            fontSize: '0.8rem',
                                                            color: 'var(--text-muted)'
                                                        }}>
                                                            <span>
                                                                {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {auth.currentUser && auth.currentUser.uid !== review.userId && (
                                                                    <button
                                                                        onClick={() => handleReport(review)}
                                                                        style={{
                                                                            background: 'transparent',
                                                                            color: 'var(--text-muted)',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.8rem',
                                                                            transition: 'color 0.2s',
                                                                            padding: 0
                                                                        }}
                                                                        onMouseEnter={e => e.target.style.color = '#ef4444'}
                                                                        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                                                                    >
                                                                        Report
                                                                    </button>
                                                                )}
                                                                {(role === "admin" || auth.currentUser?.uid === review.userId) && (
                                                                    <>
                                                                        {auth.currentUser?.uid === review.userId && (
                                                                            <button
                                                                                onClick={() => handleEditClick(review)}
                                                                                style={{
                                                                                    background: 'transparent',
                                                                                    color: '#a855f7',
                                                                                    border: '1px solid #a855f7',
                                                                                    padding: '4px 12px',
                                                                                    borderRadius: '6px',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.8rem',
                                                                                    transition: 'all 0.2s'
                                                                                }}
                                                                                onMouseEnter={e => {
                                                                                    e.target.style.background = '#a855f7';
                                                                                    e.target.style.color = 'white';
                                                                                }}
                                                                                onMouseLeave={e => {
                                                                                    e.target.style.background = 'transparent';
                                                                                    e.target.style.color = '#a855f7';
                                                                                }}
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => handleDelete(review.id)}
                                                                            style={{
                                                                                background: 'transparent',
                                                                                color: '#ef4444',
                                                                                border: '1px solid #ef4444',
                                                                                padding: '4px 12px',
                                                                                borderRadius: '6px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.8rem',
                                                                                transition: 'all 0.2s'
                                                                            }}
                                                                            onMouseEnter={e => {
                                                                                e.target.style.background = '#ef4444';
                                                                                e.target.style.color = 'white';
                                                                            }}
                                                                            onMouseLeave={e => {
                                                                                e.target.style.background = 'transparent';
                                                                                e.target.style.color = '#ef4444';
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Write Review Form */}
                            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: '600' }}>
                                    Write Your Review
                                </h3>
                                <form onSubmit={handleSubmitReview}>
                                    <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Your Rating:</span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <Star
                                                    key={star}
                                                    size={28}
                                                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                                    fill={star <= rating ? "#fbbf24" : "none"}
                                                    color={star <= rating ? "#fbbf24" : "var(--text-muted)"}
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <textarea
                                        value={newReview}
                                        onChange={e => setNewReview(e.target.value)}
                                        placeholder="Share your experience with this game..."
                                        style={{
                                            width: '100%',
                                            minHeight: '120px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            padding: '1.25rem',
                                            color: 'white',
                                            marginBottom: '1.25rem',
                                            fontSize: '1rem',
                                            fontFamily: 'inherit',
                                            lineHeight: '1.6'
                                        }}
                                    />
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '1.25rem'
                                    }}>
                                        <p style={{
                                            fontSize: '0.85rem',
                                            color: 'var(--text-muted)',
                                            margin: 0,
                                            fontStyle: 'italic'
                                        }}>
                                            Pro tip: Wrap text in <code style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                padding: '2px 4px',
                                                borderRadius: '4px',
                                                color: '#c084fc'
                                            }}>||</code> to mark it as a spoiler (e.g. <code>||hidden||</code>)
                                        </p>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="btn-primary"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '12px 28px'
                                            }}
                                        >
                                            <Send size={18} /> {submitting ? 'Posting...' : 'Post Review'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* All Reviews List */}
                            {reviews.length > 2 && (
                                <div>
                                    <h3 style={{
                                        marginBottom: '1rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontSize: '0.85rem'
                                    }}>
                                        All Reviews
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {reviews.slice(2).map(review => (
                                            <div key={review.id} className="glass-card" style={{
                                                padding: '1.5rem',
                                                background: 'rgba(255,255,255,0.03)'
                                            }}>
                                                {editingReviewId === review.id ? (
                                                    <form onSubmit={handleUpdateReview}>
                                                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>Rating:</span>
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                {[1, 2, 3, 4, 5].map(star => (
                                                                    <Star
                                                                        key={star}
                                                                        size={20}
                                                                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                                                        fill={star <= editReviewRating ? "#fbbf24" : "none"}
                                                                        color={star <= editReviewRating ? "#fbbf24" : "var(--text-muted)"}
                                                                        onClick={() => setEditReviewRating(star)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <textarea
                                                            value={editReviewText}
                                                            onChange={e => setEditReviewText(e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                minHeight: '80px',
                                                                background: 'rgba(255,255,255,0.05)',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                borderRadius: '8px',
                                                                padding: '1rem',
                                                                color: 'white',
                                                                marginBottom: '1rem',
                                                                fontSize: '0.95rem',
                                                                fontFamily: 'inherit',
                                                                lineHeight: '1.5'
                                                            }}
                                                        />
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={handleCancelEdit}
                                                                style={{
                                                                    background: 'transparent',
                                                                    color: 'var(--text-muted)',
                                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                                    padding: '6px 16px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.85rem'
                                                                }}
                                                                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                                                onMouseLeave={e => e.target.style.background = 'transparent'}
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                disabled={submitting}
                                                                className="btn-primary"
                                                                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                                                            >
                                                                {submitting ? 'Saving...' : 'Save'}
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                                            <span style={{ fontWeight: '600' }}>
                                                                <Link
                                                                    to={`/profile/${review.userId}`}
                                                                    style={{ color: 'inherit', textDecoration: 'none' }}
                                                                    onMouseEnter={e => e.target.style.color = 'var(--primary)'}
                                                                    onMouseLeave={e => e.target.style.color = 'inherit'}
                                                                >
                                                                    {review.userName}
                                                                </Link>
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        size={14}
                                                                        fill={i < review.rating ? "#fbbf24" : "none"}
                                                                        color={i < review.rating ? "#fbbf24" : "gray"}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p style={{ color: '#e4e4e7', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                                                            {renderReviewText(review.review)}
                                                        </p>
                                                        <div style={{
                                                            marginTop: '0.75rem',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            fontSize: '0.8rem',
                                                            color: 'var(--text-muted)'
                                                        }}>
                                                            <span>
                                                                {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                                            </span>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                {auth.currentUser && auth.currentUser.uid !== review.userId && (
                                                                    <button
                                                                        onClick={() => handleReport(review)}
                                                                        style={{
                                                                            background: 'transparent',
                                                                            color: 'var(--text-muted)',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.8rem',
                                                                            transition: 'color 0.2s',
                                                                            padding: 0
                                                                        }}
                                                                        onMouseEnter={e => e.target.style.color = '#ef4444'}
                                                                        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                                                                    >
                                                                        Report
                                                                    </button>
                                                                )}
                                                                {(role === "admin" || auth.currentUser?.uid === review.userId) && (
                                                                    <>
                                                                        {auth.currentUser?.uid === review.userId && (
                                                                            <button
                                                                                onClick={() => handleEditClick(review)}
                                                                                style={{
                                                                                    background: 'transparent',
                                                                                    color: '#a855f7',
                                                                                    border: '1px solid #a855f7',
                                                                                    padding: '4px 12px',
                                                                                    borderRadius: '6px',
                                                                                    cursor: 'pointer',
                                                                                    fontSize: '0.8rem',
                                                                                    transition: 'all 0.2s'
                                                                                }}
                                                                                onMouseEnter={e => {
                                                                                    e.target.style.background = '#a855f7';
                                                                                    e.target.style.color = 'white';
                                                                                }}
                                                                                onMouseLeave={e => {
                                                                                    e.target.style.background = 'transparent';
                                                                                    e.target.style.color = '#a855f7';
                                                                                }}
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            onClick={() => handleDelete(review.id)}
                                                                            style={{
                                                                                background: 'transparent',
                                                                                color: '#ef4444',
                                                                                border: '1px solid #ef4444',
                                                                                padding: '4px 12px',
                                                                                borderRadius: '6px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.8rem',
                                                                                transition: 'all 0.2s'
                                                                            }}
                                                                            onMouseEnter={e => {
                                                                                e.target.style.background = '#ef4444';
                                                                                e.target.style.color = 'white';
                                                                            }}
                                                                            onMouseLeave={e => {
                                                                                e.target.style.background = 'transparent';
                                                                                e.target.style.color = '#ef4444';
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Metadata Section */}
                        <div className="glass-card" style={{ padding: '2.5rem', position: 'relative', zIndex: 1 }}>
                            <h3 style={{
                                marginBottom: '1.5rem',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                fontSize: '0.85rem',
                                color: 'var(--text-muted)'
                            }}>
                                Available On
                            </h3>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                                {game.platforms.map(p => (
                                    <span key={p} style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {p}
                                    </span>
                                ))}
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1.5rem',
                                paddingTop: '1.5rem',
                                borderTop: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <MetaInfo label="Developer" value={game.developers.join(', ') || 'N/A'} />
                                <MetaInfo label="Avg. Playtime" value={game.playtime ? `${game.playtime} hours` : 'N/A'} />
                                <MetaInfo label="Game Modes" value="Single-player, Co-op" />
                                <MetaInfo label="Release Year" value={game.year} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Fullscreen Screenshot Modal */}
            {activeImage && (
                <div
                    className="image-modal"
                    onClick={() => setActiveImage(null)}
                >
                    <button
                        onClick={() => setActiveImage(null)}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '28px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(6px)',
                            transition: 'background 0.2s',
                            zIndex: 10
                        }}
                    >
                        ✕
                    </button>
                    <img src={activeImage} alt="Full screenshot" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}

function SubtleButton({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: active ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
                color: active ? '#c084fc' : 'var(--text-muted)',
                border: active ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.1)',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: '0.2s',
                cursor: 'pointer'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = active ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = active ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {icon} {label}
        </button>
    );
}

function GameplayCard({ icon, label, value }) {
    return (
        <div className="glass-card" style={{
            padding: '1.5rem',
            textAlign: 'center',
            transition: 'transform 0.2s'
        }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
                {icon}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {label}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: '600' }}>
                {value}
            </div>
        </div>
    );
}

function MetaInfo({ label, value }) {
    return (
        <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {label}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                {value}
            </div>
        </div>
    );
}
