const { escapeHTML } = require('../settings');

describe('escapeHTML', () => {
    test('should return an empty string for null or undefined input', () => {
        expect(escapeHTML(null)).toBe('');
        expect(escapeHTML(undefined)).toBe('');
    });

    test('should not change a string with no special characters', () => {
        expect(escapeHTML('hello world')).toBe('hello world');
    });

    test('should escape <, >, and & characters', () => {
        expect(escapeHTML('<script>alert("xss & fun")</script>')).toBe('&lt;script&gt;alert("xss &amp; fun")&lt;/script&gt;');
    });

    // The current implementation doesn't handle quotes, so this test reflects that.
    test('should not escape single or double quotes', () => {
        expect(escapeHTML('"hello\'s world"')).toBe('"hello\'s world"');
    });
});
