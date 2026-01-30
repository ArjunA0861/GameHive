// Filter out NSFW content
export const isSafeGame = (game) => {
    // Check ESRB rating
    if (game.esrb_rating && game.esrb_rating.slug === 'adults-only') return false;

    // Check tags
    const nsfwTags = ['nsfw', 'erotic', 'hentai', 'porn'];
    if (game.tags && game.tags.some(t => nsfwTags.includes(t.slug))) return false;

    // Check genres
    if (game.genres && game.genres.some(g => g.slug === 'adult')) return false;

    return true;
};
