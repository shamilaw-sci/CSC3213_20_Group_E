export const contactError = value => /^(?:0\d{9}|\+94\d{9})$/.test(value ?? '') ? '' : 'Please enter a valid Sri Lankan contact number (0771234567 or +94771234567).';
export function specificationError(data) {
  for (const [key, label] of [['bedrooms', 'Bedrooms'], ['bathrooms', 'Bathrooms'], ['landSize', 'Land size'], ['houseSize', 'House size']]) {
    const value = data[key];
    if (value === '' || value == null) continue;
    const number = Number(value);
    const count = key === 'bedrooms' || key === 'bathrooms';
    if (!Number.isFinite(number) || number < 0 || (count && !Number.isInteger(number)) || (key === 'houseSize' && number <= 0)) {
      return `${label} must be ${count ? 'zero or a positive integer' : key === 'houseSize' ? 'a positive number' : 'zero or a positive number'}.`;
    }
  }
  return '';
}
