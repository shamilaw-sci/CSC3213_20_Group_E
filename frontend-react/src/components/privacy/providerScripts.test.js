import { expect, test, vi } from 'vitest';
import { loadProviderScript } from './providerScripts';
test('shares an in-flight request and resolves on load', async () => {
  const available = vi.fn().mockReturnValue(false);
  const first = loadProviderScript('test-provider', 'https://example.test/sdk.js', available);
  const second = loadProviderScript('test-provider', 'https://example.test/sdk.js', available);
  expect(document.querySelectorAll('[data-provider="test-provider"]')).toHaveLength(1);
  const script = document.querySelector('[data-provider="test-provider"]');
  available.mockReturnValue(true);
  script.dispatchEvent(new Event('load'));
  await expect(first).resolves.toBeUndefined();
  await expect(second).resolves.toBeUndefined();
  script.remove();
});
test('rejects a loaded script that did not initialize its SDK', async () => {
  const request = loadProviderScript('missing-sdk', 'https://example.test/sdk.js', () => false);
  document.querySelector('[data-provider="missing-sdk"]').dispatchEvent(new Event('load'));
  await expect(request).rejects.toThrow('Unable to load the service');
  expect(document.querySelector('[data-provider="missing-sdk"]')).toBeNull();
});
test('does not request an SDK already available', async () => {
  const append = vi.spyOn(document.head, 'appendChild');
  await loadProviderScript('existing', 'https://example.test/sdk.js', () => true);
  expect(append).not.toHaveBeenCalled();
  append.mockRestore();
});
