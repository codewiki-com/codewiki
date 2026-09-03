import { parseTopicId, topicIdFromPath } from '@/lib/content-ids';

describe('topic ids', () => {
  it('parses', () => {
    expect(parseTopicId('python/closures/zh')).toEqual({ track: 'python', slug: 'closures', lang: 'zh' });
  });
  it('derives from file path', () => {
    expect(topicIdFromPath('python/closures.zh.mdx')).toBe('python/closures/zh');
    expect(topicIdFromPath('go/goroutines-channels.en.mdx')).toBe('go/goroutines-channels/en');
  });
  it('rejects ids and paths it cannot read', () => {
    expect(() => parseTopicId('python/closures')).toThrow();
    expect(() => parseTopicId('python/closures/fr')).toThrow();
    expect(() => topicIdFromPath('python/closures.mdx')).toThrow();
    expect(() => topicIdFromPath('closures.en.mdx')).toThrow();
  });
});
