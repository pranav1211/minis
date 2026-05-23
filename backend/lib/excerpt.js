const FEATURED_EXCERPT_LENGTH = 450;

function stripMarkdown(text) {
    return (text || '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^\s*---\s*$/gm, '')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/[*_`~>]/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function generateFeaturedExcerpt(rawMarkdown, maxLength = FEATURED_EXCERPT_LENGTH) {
    const text = stripMarkdown(rawMarkdown);
    if (text.length <= maxLength) return text;
    const sliced = text.substring(0, maxLength);
    const trimmed = sliced.replace(/\s+\S*$/, '');
    return (trimmed || sliced).trimEnd() + '…';
}

module.exports = { generateFeaturedExcerpt, stripMarkdown, FEATURED_EXCERPT_LENGTH };
