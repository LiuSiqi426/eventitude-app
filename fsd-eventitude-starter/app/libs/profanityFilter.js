// app/libs/profanityFilter.js
// 增强的脏话过滤器
const badWords = [
    'badword1', 'badword2', 'offensive', 'inappropriate', 
    'hate', 'violence', 'abuse', 'stupid', 'idiot'
]; // 可以添加更多词汇

export const filter = function(text) {
    if (!text || typeof text !== 'string') return text;
    
    let filteredText = text;
    badWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    
    return filteredText;
};

export const containsProfanity = function(text) {
    if (!text || typeof text !== 'string') return false;
    
    return badWords.some(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        return regex.test(text);
    });
};

export default { filter, containsProfanity };