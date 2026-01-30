import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp, updateDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import {
    Star,
    Shield,
    Zap,
    Crown,
    Award,
    Camera,
    FileText,
    Users,
    Gamepad2,
    Quote,
    MapPin,
    Trophy,
    Edit2,
    X
} from "lucide-react";

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function Profile() {
    const { uid } = useParams();
    const [userData, setUserData] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Edit Modal State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState("");
    const [editStatus, setEditStatus] = useState("");
    const [editQuote, setEditQuote] = useState("");
    const [editZone, setEditZone] = useState("");
    const [editFavoriteGame, setEditFavoriteGame] = useState(null);

    // Game Search State for Modal
    const [gameSearchQuery, setGameSearchQuery] = useState("");
    const [gameSearchResults, setGameSearchResults] = useState([]);
    const [isSearchingGame, setIsSearchingGame] = useState(false);

    // Follow state
    const [isFollowing, setIsFollowing] = useState(false);
    const [followDocId, setFollowDocId] = useState(null);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);



    // Initialize edit fields when user data loads
    useEffect(() => {
        if (userData) {
            setEditName(userData.name || "");
            setEditStatus(userData.status || "");
            setEditQuote(userData.quote || "");
            setEditZone(userData.zone || "EU-West");
            setEditFavoriteGame(userData.favoriteGame || null);
        }
    }, [userData]);

    useEffect(() => {
        async function loadProfile() {
            if (!uid) return;
            try {
                // Fetch user info
                const userRef = doc(db, "users", uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                } else {
                    console.log("No such user!");
                }

                // Fetch user's reviews
                const q = query(
                    collection(db, "reviews"),
                    where("userId", "==", uid)
                );

                const reviewSnap = await getDocs(q);
                setReviews(reviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch followers count
                const followersQuery = query(
                    collection(db, "followers"),
                    where("followingId", "==", uid)
                );
                const followersSnap = await getDocs(followersQuery);
                setFollowersCount(followersSnap.size);

                // Fetch following count
                const followingQuery = query(
                    collection(db, "followers"),
                    where("followerId", "==", uid)
                );
                const followingSnap = await getDocs(followingQuery);
                setFollowingCount(followingSnap.size);

            } catch (err) {
                console.error("Error loading profile:", err);
            } finally {
                setLoading(false);
            }
        }

        async function checkFollowStatus() {
            if (!auth.currentUser || auth.currentUser.uid === uid || !uid) return;

            const q = query(
                collection(db, "followers"),
                where("followerId", "==", auth.currentUser.uid),
                where("followingId", "==", uid)
            );

            const snap = await getDocs(q);

            if (!snap.empty) {
                setIsFollowing(true);
                setFollowDocId(snap.docs[0].id);
            } else {
                setIsFollowing(false);
                setFollowDocId(null);
            }
        }

        loadProfile();
        checkFollowStatus();
    }, [uid]);

    async function saveProfileChanges() {
        if (!auth.currentUser || auth.currentUser.uid !== uid) {
            alert("You are not authorized to edit this profile.");
            return;
        }

        try {
            const userRef = doc(db, "users", uid);

            // Create a sanitized game object to avoid 'undefined' values and massive payloads
            const cleanFavoriteGame = editFavoriteGame ? {
                id: editFavoriteGame.id,
                name: editFavoriteGame.name,
                background_image: editFavoriteGame.background_image || null,
                slug: editFavoriteGame.slug || null,
                genres: editFavoriteGame.genres ? editFavoriteGame.genres.map(g => ({ name: g.name })) : []
            } : null;

            const updates = {
                name: editName || "",
                status: editStatus || "",
                quote: editQuote || "",
                zone: editZone || "EU-West",
                favoriteGame: cleanFavoriteGame
            };

            await setDoc(userRef, updates, { merge: true });

            setUserData(prev => ({
                ...prev,
                ...updates
            }));
            setIsEditingProfile(false);
        } catch (error) {
            console.error("Error saving profile:", error);
            alert(`Failed to save profile changes: ${error.message}`);
        }
    }

    async function searchGames(e) {
        // e.preventDefault(); // If button is inside a form, but here it's just a div structure usually
        if (!gameSearchQuery.trim()) return;
        setIsSearchingGame(true);
        try {
            const res = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${gameSearchQuery}&page_size=5`);
            const data = await res.json();
            setGameSearchResults(data.results);
        } catch (error) {
            console.error("Error searching games:", error);
        } finally {
            setIsSearchingGame(false);
        }
    }

    async function followUser() {
        if (!auth.currentUser) {
            alert("Please sign in to follow users");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, "followers"), {
                followerId: auth.currentUser.uid,
                followingId: uid,
                createdAt: serverTimestamp()
            });

            setIsFollowing(true);
            setFollowDocId(docRef.id);
            setFollowersCount(prev => prev + 1);
        } catch (error) {
            console.error("Error following user:", error);
            alert("Failed to follow user");
        }
    }

    async function unfollowUser() {
        if (!followDocId) return;

        try {
            await deleteDoc(doc(db, "followers", followDocId));
            setIsFollowing(false);
            setFollowDocId(null);
            setFollowersCount(prev => prev - 1);
        } catch (error) {
            console.error("Error unfollowing user:", error);
            alert("Failed to unfollow user");
        }
    }

    async function handleImageSelected(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('Image size should be less than 2MB');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const data = await response.json();
            let imageUrl = data.secure_url;

            // Apply transformations (resize to 300x300, face crop)
            if (imageUrl.includes('/upload/')) {
                imageUrl = imageUrl.replace('/upload/', '/upload/w_300,h_300,c_fill,g_face/');
            }

            // Save to Firestore
            const userRef = doc(db, "users", uid);
            await setDoc(userRef, { photoURL: imageUrl }, { merge: true });

            setUserData(prev => ({ ...prev, photoURL: imageUrl }));
        } catch (error) {
            console.error("Error updating profile picture:", error);
            alert(`Failed to update profile picture: ${error.message}`);
        } finally {
            setUploading(false);
        }
    }



    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>Loading Profile...</div>;
    }

    // Styles
    const panelStyle = {
        background: 'rgba(255, 255, 255, 0.03)', // Lighter, more glassy
        backdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px', // Rounded corners
        padding: '24px',
        color: '#e4e4e7',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
    };

    const headerPanelStyle = {
        ...panelStyle,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '25px',
        marginBottom: '20px'
    };

    const isOwnProfile = auth.currentUser?.uid === uid;

    // Leveling System Logic
    // Leveling System: 1 Review = 1 Level
    const reviewCount = reviews.length;
    const level = Math.max(reviewCount, 1); // Start at level 1 even with 0 reviews

    let rankTitle = "Bronze";
    let rankColor = "#cd7f32"; // Bronze
    let nextRankLevel = 5;
    let rankMinLevel = 1;

    if (level >= 5 && level < 10) {
        rankTitle = "Silver";
        rankColor = "#C0C0C0"; // Silver
        rankMinLevel = 5;
        nextRankLevel = 10;
    } else if (level >= 10 && level < 20) {
        rankTitle = "Gold";
        rankColor = "#FFD700"; // Gold
        rankMinLevel = 10;
        nextRankLevel = 20;
    } else if (level >= 20 && level < 50) {
        rankTitle = "Platinum";
        rankColor = "#E5E4E2"; // Platinum
        rankMinLevel = 20;
        nextRankLevel = 50;
    } else if (level >= 50) {
        rankTitle = "Diamond";
        rankColor = "#b9f2ff"; // Diamond (Ice Blue)
        rankMinLevel = 50;
        nextRankLevel = 100; // Cap or keep valid
    }

    // Calculate progress relative to the current rank tier
    const levelsInTier = nextRankLevel - rankMinLevel;
    const levelsEarnedInTier = level - rankMinLevel;
    const progressToNextRank = Math.min((levelsEarnedInTier / levelsInTier) * 100, 100);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '100px 0 50px' }}>
            <div className="container" style={{ maxWidth: '1100px' }}>

                {/* --- HEADER SECTION (Full Width) --- */}
                <div style={{ ...headerPanelStyle, marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '30px' }}>
                        {/* Avatar Box */}
                        <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                            {userData?.photoURL ? (
                                <img
                                    src={userData.photoURL}
                                    alt="Profile"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '50%',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: '#27272a',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '3rem',
                                    color: '#71717a'
                                }}>
                                    {userData?.name?.charAt(0) || 'U'}
                                </div>
                            )}

                            {/* Upload Overlay */}
                            {isOwnProfile && (
                                <label
                                    htmlFor="profile-upload"
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.6)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: uploading ? 'wait' : 'pointer',
                                        opacity: 0,
                                        transition: 'opacity 0.2s'
                                    }}
                                    className="avatar-overlay"
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                >
                                    <Camera size={24} color="white" />
                                    <input
                                        type="file"
                                        id="profile-upload"
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleImageSelected}
                                        disabled={uploading}
                                    />
                                </label>
                            )}
                        </div>

                        {/* Name & StatusInfo */}
                        <div style={{ paddingTop: '5px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: '2rem',
                                    fontWeight: '600',
                                    letterSpacing: '0.5px'
                                }}>
                                    {userData?.name || 'User'}
                                </h1>
                                {/* Follow Button */}
                                {!isOwnProfile && auth.currentUser && (
                                    <button
                                        onClick={isFollowing ? unfollowUser : followUser}
                                        style={{
                                            background: isFollowing ? 'transparent' : 'var(--primary)',
                                            border: isFollowing ? '1px solid #52525b' : 'none',
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            marginLeft: '10px'
                                        }}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                )}

                                {/* Edit Profile Button (Next to Name) */}
                                {isOwnProfile && (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            color: '#e4e4e7',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '0.75rem',
                                            marginLeft: '10px'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    >
                                        <Edit2 size={12} />
                                        <span>Edit Profile</span>
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a1a1aa', fontSize: '0.9rem' }}>
                                <MapPin size={14} />
                                <span>{userData?.zone ? userData.zone : "Earth, Milky Way"}</span>
                            </div>

                            <div style={{ marginTop: '20px', fontStyle: 'italic', color: '#d4d4d8', fontFamily: 'serif', fontSize: '1.1rem' }}>
                                "{userData?.quote || "How could I have lived without that smile."}"
                            </div>
                        </div>
                    </div>

                    {/* Level / XP Section */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '1.2rem',
                                color: '#e4e4e7',
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                Level
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: '2px solid var(--primary)', /* GameHive Theme */
                                    fontSize: '0.9rem',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}>
                                    {level}
                                </span>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '10px 15px',
                            borderRadius: '4px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            border: '1px solid rgba(255,255,255,0.05)',
                            minWidth: '160px'
                        }}>
                            <Star size={24} fill={rankColor} stroke={rankColor} style={{ opacity: 0.8 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Rank</div>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: rankColor }}>{rankTitle}</div>

                                {/* Mini Progress Bar */}
                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px' }}>
                                    <div style={{
                                        width: `${progressToNextRank}%`,
                                        height: '100%',
                                        background: rankColor,
                                        borderRadius: '2px',
                                        transition: 'width 0.5s ease-out'
                                    }} />
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px', textAlign: 'right' }}>
                                    {level} / {nextRankLevel} Next Rank
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAIN LAYOUT (Single Column) --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Quote / Status Panel */}
                    <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '100px', position: 'relative' }}>
                        <Quote size={16} style={{ position: 'absolute', top: '10px', left: '10px', opacity: 0.3 }} />
                        <div style={{ padding: '0 20px' }}>
                            {userData?.status ? (
                                <div style={{ color: '#d4d4d8', fontSize: '1.1rem', fontStyle: 'italic' }}>
                                    ~ {userData.status}
                                </div>
                            ) : (
                                <div style={{ color: '#52525b', fontStyle: 'italic' }}>
                                    No status set.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Favorite Game / Featured Panel */}
                    <div style={panelStyle}>
                        <h3 style={{ fontSize: '1rem', color: '#a1a1aa', margin: '0 0 15px 0' }}>Favorite Game</h3>

                        {userData?.favoriteGame ? (
                            <div style={{ display: 'flex', gap: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '4px' }}>
                                <div style={{ width: '80px', height: '100px', background: '#3f3f46', borderRadius: '4px', overflow: 'hidden' }}>
                                    <img src={userData.favoriteGame.background_image} alt={userData.favoriteGame.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>{userData.favoriteGame.name}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>
                                        {userData.favoriteGame.genres?.map(g => g.name).join(', ')}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', alignSelf: 'center' }}>
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= 5 ? "#7c3aed" : "none"} stroke="#7c3aed" />)}
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed #3f3f46', borderRadius: '4px', color: '#71717a' }}>
                                {isOwnProfile ? "Go to a game page to set it as your favorite!" : "No favorite game selected."}
                            </div>
                        )}
                    </div>

                    {/* Recent Reviews Panel */}
                    <div style={panelStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1rem', color: '#a1a1aa', margin: 0 }}>Recent Reviews</h3>
                            <span style={{ fontSize: '0.8rem', color: '#7c3aed', cursor: 'pointer' }}>View All</span>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            {reviews.length === 0 ? (
                                <div style={{ width: '100%', textAlign: 'center', padding: '20px', color: '#71717a' }}>No reviews yet.</div>
                            ) : (
                                reviews.map((review) => (
                                    <ReviewPoster key={review.id} review={review} />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Info / Stats Row (Previously Sidebar) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                        {/* Status / Activity Panel */}
                        <div style={panelStyle}>
                            <h3 style={{ fontSize: '1.2rem', color: '#7c3aed', margin: '0 0 20px 0' }}>Online Stats</h3>

                            {/* Inventory */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} /> Reviews</span>
                                    <span style={{ color: '#a1a1aa' }}>{reviews.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Followers</span>
                                    <span style={{ color: '#a1a1aa' }}>{followersCount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Following</span>
                                    <span style={{ color: '#a1a1aa' }}>{followingCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Info / Footer Panel */}
                        <div style={panelStyle}>
                            <h3 style={{ fontSize: '1rem', color: '#a1a1aa', margin: '0 0 15px 0' }}>Infos importantes</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Trophy size={14} color={rankColor} /> <span>Rank: <span style={{ color: rankColor, fontWeight: 'bold' }}>{rankTitle}</span></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={14} /> <span>Zone: {userData?.zone || "EU-West"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* --- EDIT PROFILE MODAL --- */}
                {isEditingProfile && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            background: '#18181b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            width: '90%',
                            maxWidth: '500px',
                            padding: '30px',
                            position: 'relative',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
                        }}>
                            <button
                                onClick={() => setIsEditingProfile(false)}
                                style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '15px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#71717a',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ margin: '0 0 25px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Edit Profile</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Name Input */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Display Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(0,0,0,0.3)',
                                            border: '1px solid #3f3f46',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>



                                {/* Status Input */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Status (Short, visible in panel)</label>
                                    <input
                                        type="text"
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value)}
                                        placeholder="What are you doing now?"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(0,0,0,0.3)',
                                            border: '1px solid #3f3f46',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>

                                {/* Quote Input */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Bio / Quote (Visible in header)</label>
                                    <textarea
                                        value={editQuote}
                                        onChange={(e) => setEditQuote(e.target.value)}
                                        rows={2}
                                        placeholder="Your favorite quote..."
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(0,0,0,0.3)',
                                            border: '1px solid #3f3f46',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '1rem',
                                            fontFamily: 'inherit',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                {/* Zone Input */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Zone / Region</label>
                                    <select
                                        value={editZone}
                                        onChange={(e) => setEditZone(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(0,0,0,0.3)',
                                            border: '1px solid #3f3f46',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <option value="EU-West">EU-West</option>
                                        <option value="EU-East">EU-East</option>
                                        <option value="NA-West">NA-West</option>
                                        <option value="NA-East">NA-East</option>
                                        <option value="Asia">Asia</option>
                                        <option value="Oceania">Oceania</option>
                                        <option value="Earth">Earth</option>
                                    </select>
                                </div>

                                {/* Favorite Game Input */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Favorite Game</label>

                                    {editFavoriteGame ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
                                            {editFavoriteGame.background_image && (
                                                <img src={editFavoriteGame.background_image} alt="game" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                            )}
                                            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 'bold' }}>{editFavoriteGame.name}</div>
                                            <button
                                                onClick={() => setEditFavoriteGame(null)}
                                                style={{ color: '#ef4444', background: 'transparent', fontSize: '0.8rem' }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    value={gameSearchQuery}
                                                    onChange={(e) => setGameSearchQuery(e.target.value)}
                                                    placeholder="Search for a game..."
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        background: 'rgba(0,0,0,0.3)',
                                                        border: '1px solid #3f3f46',
                                                        borderRadius: '4px',
                                                        color: 'white',
                                                        fontSize: '0.9rem'
                                                    }}
                                                />
                                                <button
                                                    onClick={searchGames}
                                                    disabled={isSearchingGame}
                                                    style={{
                                                        background: 'var(--primary)',
                                                        color: 'white',
                                                        padding: '0 15px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {isSearchingGame ? '...' : 'Find'}
                                                </button>
                                            </div>

                                            {/* Results Dropdown */}
                                            {gameSearchResults.length > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    background: '#18181b',
                                                    border: '1px solid #3f3f46',
                                                    borderRadius: '4px',
                                                    marginTop: '4px',
                                                    zIndex: 10,
                                                    maxHeight: '200px',
                                                    overflowY: 'auto'
                                                }}>
                                                    {gameSearchResults.map(game => (
                                                        <div
                                                            key={game.id}
                                                            onClick={() => {
                                                                setEditFavoriteGame(game);
                                                                setGameSearchResults([]);
                                                                setGameSearchQuery("");
                                                            }}
                                                            style={{
                                                                padding: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            {game.background_image && (
                                                                <img src={game.background_image} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />
                                                            )}
                                                            <div style={{ fontSize: '0.9rem' }}>{game.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={saveProfileChanges}
                                    style={{
                                        marginTop: '10px',
                                        padding: '12px',
                                        background: 'var(--primary)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.target.style.background = '#6d28d9'}
                                    onMouseLeave={e => e.target.style.background = 'var(--primary)'}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Inline Component for Individual Review Poster
function ReviewPoster({ review }) {
    const [imageUrl, setImageUrl] = useState(review.gameCover || null);

    useEffect(() => {
        if (!imageUrl && review.gameId) {
            fetch(`https://api.rawg.io/api/games/${review.gameId}?key=${API_KEY}`)
                .then(res => res.json())
                .then(data => {
                    if (data.background_image) {
                        setImageUrl(data.background_image);
                    }
                })
                .catch(err => console.error("Failed to fetch game image:", err));
        }
    }, [review, imageUrl]);

    return (
        <div style={{ width: '23%', minWidth: '120px', marginBottom: '15px' }}>
            <div style={{
                position: 'relative',
                aspectRatio: '2/3',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#1c1c1c'
            }}>
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={review.gameTitle}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#445566', fontSize: '10px', textAlign: 'center', padding: '5px' }}>
                        {review.gameTitle}
                    </div>
                )}

                {/* Hover Effect */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                />
            </div>
            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                {[...Array(5)].map((_, i) => (
                    <span key={i} style={{
                        color: i < review.rating ? '#7c3aed' : '#2c3440', // GameHive Theme Purple
                        fontSize: '12px'
                    }}>★</span>
                ))}
            </div>
        </div>
    );
}

export default Profile;
