import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp, setDoc, updateDoc, Timestamp } from "firebase/firestore";
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
    X,
    RefreshCw,
    ExternalLink
} from "lucide-react";
import { initiateSteamLogin, handleSteamCallback } from "../utils/steamAuth";
import { getPlayerSummaries, getOwnedGames, getRawgIdBySteamAppId } from "../services/steamApi";

// Sub-components
import ProfileHeader from "../components/profile/ProfileHeader";
import SteamCollection from "../components/profile/SteamCollection";
import LibrarySection from "../components/profile/LibrarySection";
import RecentReviews from "../components/profile/RecentReviews";
import OnlineStats from "../components/profile/OnlineStats";
import StatsModal from "../components/profile/StatsModal";
import EditProfileModal from "../components/profile/EditProfileModal";

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function Profile() {
    const navigate = useNavigate();
    const location = useLocation();
    const { uid } = useParams();
    const [userData, setUserData] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
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

    // Library state
    const [library, setLibrary] = useState([]);
    const [libraryFilter, setLibraryFilter] = useState('All');

    // Stats Modal State
    const [activeStatView, setActiveStatView] = useState(null); // 'followers' | 'following'
    const [modalData, setModalData] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

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

    // Handle Steam OpenID Callback
    useEffect(() => {
        const steamId = handleSteamCallback();
        console.log("Steam Callback Check:", { steamId, currentUser: auth.currentUser?.uid, pageUid: uid });
        
        if (steamId && auth.currentUser) {
            if (auth.currentUser.uid === uid) {
                handleSteamConnect(steamId);
            } else {
                console.warn("Steam ID extracted but UID mismatch or user not logged in to correct account");
            }
        }
    }, [uid, auth.currentUser, location.search]);

    const handleSteamConnect = async (steamId) => {
        console.log("Starting Steam Connection for:", steamId);
        setIsSyncing(true);
        try {
            const profile = await getPlayerSummaries(steamId);
            console.log("Fetched Steam Profile:", profile);
            
            const userRef = doc(db, "users", auth.currentUser.uid);
            
            const steamData = {
                steamId: steamId,
                steamConnected: true,
                steamProfile: {
                    name: profile?.personaname || "",
                    avatar: profile?.avatarfull || "",
                    profileurl: profile?.profileurl || ""
                }
            };

            await setDoc(userRef, steamData, { merge: true });
            console.log("Saved Steam data to Firestore");
            setUserData(prev => ({ ...prev, ...steamData }));
            
            // Clean up URL
            navigate(window.location.pathname, { replace: true });
            
            // Automatically trigger first sync
            await syncSteamLibrary(steamId);
        } catch (err) {
            console.error("Steam connect failed:", err);
            alert("Failed to connect Steam account");
        } finally {
            setIsSyncing(false);
        }
    };

    const syncSteamLibrary = async (steamId) => {
        if (!steamId || !auth.currentUser) return;
        setIsSyncing(true);
        try {
            const games = await getOwnedGames(steamId);
            console.log(`Found ${games.length} Steam games`);

            for (const game of games) {
                console.log(`[Sync] Checking game: "${game.name}"`);
                // Check if already in library
                const q = query(
                    collection(db, "library"),
                    where("userId", "==", auth.currentUser.uid),
                    where("steamAppId", "==", game.appid)
                );
                const snap = await getDocs(q);

                if (snap.empty) {
                    console.log(`[Sync] Importing new game: "${game.name}"`);
                    const rawgGame = await getRawgIdBySteamAppId(game.appid, game.name);
                    await addDoc(collection(db, "library"), {
                        userId: auth.currentUser.uid,
                        gameId: rawgGame?.id || null,
                        steamAppId: game.appid,
                        playtime: Math.round(game.playtime_forever / 60),
                        source: "steam",
                        importedAt: Timestamp.now(),
                        gameTitle: game.name,
                        gameCover: rawgGame?.background_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`
                    });
                } else {
                    const docId = snap.docs[0].id;
                    const existingData = snap.docs[0].data();
                    
                    if (!existingData.gameId) {
                        console.log(`[Sync] Repairing missing ID for: "${game.name}"`);
                        const rawgGame = await getRawgIdBySteamAppId(game.appid, game.name);
                        if (rawgGame) {
                            await setDoc(doc(db, "library", docId), {
                                gameId: rawgGame.id,
                                gameCover: rawgGame.background_image || existingData.gameCover,
                                playtime: Math.round(game.playtime_forever / 60),
                                lastSynced: Timestamp.now()
                            }, { merge: true });
                            console.log(`[Sync] Successfully repaired: "${game.name}" -> RAWG ID: ${rawgGame.id}`);
                        } else {
                            console.warn(`[Sync] Could not find RAWG ID for: "${game.name}"`);
                            // Still update playtime
                            await setDoc(doc(db, "library", docId), {
                                playtime: Math.round(game.playtime_forever / 60),
                                lastSynced: Timestamp.now()
                            }, { merge: true });
                        }
                    } else {
                        // Regular update
                        await setDoc(doc(db, "library", docId), {
                            playtime: Math.round(game.playtime_forever / 60),
                            lastSynced: Timestamp.now()
                        }, { merge: true });
                    }
                }
            }
            
            // Refresh library state
            const libQ = query(collection(db, "library"), where("userId", "==", uid));
            const libSnap = await getDocs(libQ);
            setLibrary(libSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            
            alert(`Sync complete! Checked ${games.length} games.`);
        } catch (err) {
            console.error("Sync failed:", err);
            alert("Steam library sync failed");
        } finally {
            setIsSyncing(false);
        }
    };

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
                // Count unique followers to handle potential duplicate records
                const uniqueFollowers = new Set(followersSnap.docs.map(doc => doc.data().followerId));
                setFollowersCount(uniqueFollowers.size);

                // Fetch following count
                const followingQuery = query(
                    collection(db, "followers"),
                    where("followerId", "==", uid)
                );
                const followingSnap = await getDocs(followingQuery);
                const uniqueFollowing = new Set(followingSnap.docs.map(doc => doc.data().followingId));
                setFollowingCount(uniqueFollowing.size);

                // Fetch user's library
                const libraryQuery = query(
                    collection(db, "library"),
                    where("userId", "==", uid)
                );
                const librarySnap = await getDocs(libraryQuery);
                const libraryData = librarySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLibrary(libraryData);

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

    async function fetchDetailedUsers(userIds) {
        if (!userIds || userIds.length === 0) return [];
        const users = [];
        const chunks = [];
        for (let i = 0; i < userIds.length; i += 10) {
            chunks.push(userIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const q = query(collection(db, "users"), where("__name__", "in", chunk));
            const snap = await getDocs(q);
            snap.forEach(doc => {
                users.push({ uid: doc.id, ...doc.data() });
            });
        }
        return users;
    }

    async function handleOpenStatsModal(type) {
        if (activeStatView === type) {
            setActiveStatView(null);
            return;
        }

        setActiveStatView(type);
        setModalLoading(true);
        setModalData([]);

        try {
            if (type === 'followers') {
                const q = query(collection(db, "followers"), where("followingId", "==", uid));
                const snap = await getDocs(q);
                // Use a Set to get unique follower IDs
                const followerIds = [...new Set(snap.docs.map(doc => doc.data().followerId))];
                const details = await fetchDetailedUsers(followerIds);
                setModalData(details);
            } else if (type === 'following') {
                const q = query(collection(db, "followers"), where("followerId", "==", uid));
                const snap = await getDocs(q);
                // Use a Set to get unique following IDs
                const followingIds = [...new Set(snap.docs.map(doc => doc.data().followingId))];
                const details = await fetchDetailedUsers(followingIds);
                setModalData(details);
            }
        } catch (error) {
            console.error(`Error loading ${type}:`, error);
        } finally {
            setModalLoading(false);
        }
    }

    async function saveProfileChanges() {
        if (!auth.currentUser || auth.currentUser.uid !== uid) {
            alert("You are not authorized to edit this profile.");
            return;
        }

        try {
            const userRef = doc(db, "users", uid);

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

    async function searchGames() {
        if (!gameSearchQuery.trim()) return;
        setIsSearchingGame(true);
        try {
            const res = await fetch(`/api/rawg/games?key=${API_KEY}&search=${gameSearchQuery}&page_size=5`);
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
            // Idempotency check: verify if already following
            const q = query(
                collection(db, "followers"),
                where("followerId", "==", auth.currentUser.uid),
                where("followingId", "==", uid)
            );
            const snap = await getDocs(q);
            
            if (!snap.empty) {
                console.log("Already following");
                setIsFollowing(true);
                setFollowDocId(snap.docs[0].id);
                return;
            }

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

    const handleLibraryGameClick = async (e, game) => {
        // Prevent default only if we are taking over navigation
        console.log("[Profile] Library Game Clicked:", { 
            title: game.gameTitle, 
            id: game.id, 
            gameId: game.gameId,
            steamAppId: game.steamAppId 
        });

        const hasValidGameId = game.gameId && game.gameId !== "null" && game.gameId !== "undefined";

        if (hasValidGameId) {
            console.log("[Profile] Navigating directly to:", game.gameId);
            navigate(`/game/${game.gameId}`);
            return;
        }

        // If we get here, the game has no valid RAWG ID
        console.log(`[Profile] No valid ID found for "${game.gameTitle}". Attempting repair...`);
        
        if (isSyncing) {
            console.warn("[Profile] Sync in progress, ignoring click");
            return;
        }

        setIsSyncing(true);
        try {
            const rawgGame = await getRawgIdBySteamAppId(game.steamAppId, game.gameTitle);
            
            if (rawgGame && rawgGame.id) {
                console.log(`[Profile] Repair SUCCESS: found match ID ${rawgGame.id}`);
                const gameRef = doc(db, "library", game.id);
                
                await updateDoc(gameRef, {
                    gameId: rawgGame.id,
                    gameCover: rawgGame.background_image || game.gameCover || null
                });
                
                // Immediately update local state so UI reflects it
                setLibrary(prev => prev.map(item => 
                    item.id === game.id ? { ...item, gameId: rawgGame.id, gameCover: rawgGame.background_image || item.gameCover } : item
                ));

                console.log("[Profile] Local state updated. Navigating...");
                navigate(`/game/${rawgGame.id}`);
            } else {
                console.error(`[Profile] Repair FAILED: No match found for "${game.gameTitle}"`);
                alert(`We couldn't find a page for "${game.gameTitle}" in the RAWG database.`);
            }
        } catch (err) {
            console.error("[Profile] Navigation/Repair error:", err);
            alert("Oops! Something went wrong while opening the game page.");
        } finally {
            setIsSyncing(false);
        }
    };

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

            if (imageUrl.includes('/upload/')) {
                imageUrl = imageUrl.replace('/upload/', '/upload/w_300,h_300,c_fill,g_face/');
            }

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

    const panelStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
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
    const reviewCount = reviews.length;
    const level = Math.max(reviewCount, 1);

    let rankTitle = "Bronze";
    let rankColor = "#cd7f32";
    let nextRankLevel = 5;
    let rankMinLevel = 1;

    if (level >= 5 && level < 10) {
        rankTitle = "Silver";
        rankColor = "#C0C0C0";
        rankMinLevel = 5;
        nextRankLevel = 10;
    } else if (level >= 10 && level < 20) {
        rankTitle = "Gold";
        rankColor = "#FFD700";
        rankMinLevel = 10;
        nextRankLevel = 20;
    } else if (level >= 20 && level < 50) {
        rankTitle = "Platinum";
        rankColor = "#E5E4E2";
        rankMinLevel = 20;
        nextRankLevel = 50;
    } else if (level >= 50) {
        rankTitle = "Diamond";
        rankColor = "#b9f2ff";
        rankMinLevel = 50;
        nextRankLevel = 100;
    }

    const levelsInTier = nextRankLevel - rankMinLevel;
    const levelsEarnedInTier = level - rankMinLevel;
    const progressToNextRank = Math.min((levelsEarnedInTier / levelsInTier) * 100, 100);

    return (
        <div style={{ background: '#09090b', minHeight: '100vh', color: 'white', padding: '100px 20px 40px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                <ProfileHeader 
                    userData={userData}
                    isOwnProfile={isOwnProfile}
                    isFollowing={isFollowing}
                    unfollowUser={unfollowUser}
                    followUser={followUser}
                    setIsEditingProfile={setIsEditingProfile}
                    uploading={uploading}
                    handleImageSelected={handleImageSelected}
                    syncSteamLibrary={syncSteamLibrary}
                    isSyncing={isSyncing}
                    initiateSteamLogin={initiateSteamLogin}
                    level={level}
                    rankColor={rankColor}
                    rankTitle={rankTitle}
                    progressToNextRank={progressToNextRank}
                    nextRankLevel={nextRankLevel}
                    headerPanelStyle={headerPanelStyle}
                />

                {/* --- MAIN LAYOUT --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '100px', position: 'relative' }}>
                        <Quote size={16} style={{ position: 'absolute', top: '10px', left: '10px', opacity: 0.3 }} />
                        <div style={{ padding: '0 20px' }}>
                            {userData?.status ? (
                                <div style={{ color: '#d4d4d8', fontSize: '1.1rem', fontStyle: 'italic' }}>~ {userData.status}</div>
                            ) : (
                                <div style={{ color: '#52525b', fontStyle: 'italic' }}>No status set.</div>
                            )}
                        </div>
                    </div>

                    <SteamCollection 
                        library={library}
                        handleLibraryGameClick={handleLibraryGameClick}
                        panelStyle={panelStyle}
                    />

                    <LibrarySection 
                        panelStyle={panelStyle}
                        library={library}
                        libraryFilter={libraryFilter}
                        setLibraryFilter={setLibraryFilter}
                        handleLibraryGameClick={handleLibraryGameClick}
                    />

                    <RecentReviews 
                        panelStyle={panelStyle}
                        reviews={reviews}
                    />

                    <OnlineStats 
                        panelStyle={panelStyle}
                        reviews={reviews}
                        followersCount={followersCount}
                        followingCount={followingCount}
                        library={library}
                        userData={userData}
                        activeStatView={activeStatView}
                        handleOpenStatsModal={handleOpenStatsModal}
                        rankColor={rankColor}
                        rankTitle={rankTitle}
                    />

                </div>

                <StatsModal 
                    activeStatView={activeStatView}
                    setActiveStatView={setActiveStatView}
                    modalLoading={modalLoading}
                    modalData={modalData}
                    panelStyle={panelStyle}
                />

                <EditProfileModal 
                    isEditingProfile={isEditingProfile}
                    setIsEditingProfile={setIsEditingProfile}
                    editName={editName}
                    setEditName={setEditName}
                    editStatus={editStatus}
                    setEditStatus={setEditStatus}
                    editQuote={editQuote}
                    setEditQuote={setEditQuote}
                    editZone={editZone}
                    setEditZone={setEditZone}
                    editFavoriteGame={editFavoriteGame}
                    setEditFavoriteGame={setEditFavoriteGame}
                    gameSearchQuery={gameSearchQuery}
                    setGameSearchQuery={setGameSearchQuery}
                    gameSearchResults={gameSearchResults}
                    setGameSearchResults={setGameSearchResults}
                    searchGames={searchGames}
                    saveProfileChanges={saveProfileChanges}
                />
            </div>
        </div>
    );
}

export default Profile;
;
