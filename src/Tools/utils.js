export const capitalize = (str) => {
    str = str.toLowerCase();
    return str.replace(/\b\w/g, c => c.toUpperCase());
}