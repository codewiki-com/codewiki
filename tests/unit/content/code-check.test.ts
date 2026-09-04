import {
  checkFence,
  checkFences,
  normaliseLang,
  stripJsonComments,
} from '../../../scripts/content/lib/code-check';

/** Run a check with the external-tool search path replaced (empty string = no tools at all). */
async function withPath<T>(path: string, run: () => Promise<T>): Promise<T> {
  const previous = process.env.CODE_CHECK_PATH;
  process.env.CODE_CHECK_PATH = path;
  try {
    return await run();
  } finally {
    if (previous === undefined) delete process.env.CODE_CHECK_PATH;
    else process.env.CODE_CHECK_PATH = previous;
  }
}

describe('normaliseLang', () => {
  it('folds aliases onto a canonical language', () => {
    expect(normaliseLang('JavaScript')).toBe('js');
    expect(normaliseLang('mjs')).toBe('js');
    expect(normaliseLang('cjs')).toBe('js');
    expect(normaliseLang('typescript')).toBe('ts');
    expect(normaliseLang('py')).toBe('python');
    expect(normaliseLang('python3')).toBe('python');
    expect(normaliseLang('golang')).toBe('go');
    expect(normaliseLang('rs')).toBe('rust');
    expect(normaliseLang('c++')).toBe('cpp');
    expect(normaliseLang('cxx')).toBe('cpp');
    expect(normaliseLang('c')).toBe('cpp');
    expect(normaliseLang('csharp')).toBe('csharp');
    expect(normaliseLang('kt')).toBe('kotlin');
    expect(normaliseLang('yml')).toBe('yaml');
  });
  it('maps prose, config and unknown languages to skip', () => {
    for (const lang of ['sql', 'bash', 'sh', 'console', 'diff', 'mermaid', 'html', 'json5', '', 'brainfuck'])
      expect(normaliseLang(lang)).toBe('skip');
  });
});

describe('checkFence', () => {
  it('accepts valid javascript', async () => {
    await expect(
      checkFence({ lang: 'js', code: 'const a = 1;\nexport default a;\n' }),
    ).resolves.toMatchObject({
      ok: true,
      tool: 'esbuild',
    });
  });
  it('rejects broken javascript with a line number', async () => {
    const result = await checkFence({ lang: 'javascript', code: 'const = 1\n' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/line 1/);
  });
  it('accepts typescript-only syntax under the ts alias', async () => {
    await expect(
      checkFence({ lang: 'typescript', code: 'interface A { b: string }\nconst a: A = { b: "c" };\n' }),
    ).resolves.toMatchObject({ ok: true });
  });
  it('accepts tsx and rejects broken tsx', async () => {
    await expect(
      checkFence({ lang: 'tsx', code: 'const a = (p: { x: number }) => <b>{p.x}</b>;\n' }),
    ).resolves.toMatchObject({ ok: true });
    await expect(checkFence({ lang: 'tsx', code: 'const a = <b>;\n' })).resolves.toMatchObject({ ok: false });
  });

  it('accepts valid python', async () => {
    await expect(
      checkFence({ lang: 'python', code: 'def f(x):\n    return x + 1\n\n\nprint(f(1))\n' }),
    ).resolves.toMatchObject({ ok: true, tool: 'python3' });
  });
  it('rejects broken python with a line number', async () => {
    const result = await checkFence({ lang: 'py', code: '\ndef f(:\n    return 1\n' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/line 2/);
  });

  it('rejects json with a trailing comma', async () => {
    const result = await checkFence({ lang: 'json', code: '{\n  "a": 1,\n}\n' });
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
  it('accepts comments in json as well as jsonc', async () => {
    const code = '{\n  // note\n  /* block\n     comment */\n  "a": "http://x//y"\n}\n';
    await expect(checkFence({ lang: 'jsonc', code })).resolves.toMatchObject({ ok: true });
    await expect(checkFence({ lang: 'json', code })).resolves.toMatchObject({ ok: true });
  });
  it('keeps comment markers that sit inside json strings', () => {
    expect(stripJsonComments('{"a": "x // y", "b": "p /* q */ r"}')).toBe(
      '{"a": "x // y", "b": "p /* q */ r"}',
    );
    expect(stripJsonComments('{ // c\n  "a": 1\n}')).toBe('{ \n  "a": 1\n}');
    expect(stripJsonComments('{/* a\nb */ "c": 1}')).toBe('{\n "c": 1}');
  });
  it('checks yaml', async () => {
    await expect(checkFence({ lang: 'yml', code: 'a:\n  b: 1\n' })).resolves.toMatchObject({ ok: true });
    await expect(checkFence({ lang: 'yaml', code: 'a: [1, 2\n' })).resolves.toMatchObject({ ok: false });
  });
  it('accepts multi-document yaml streams', async () => {
    await expect(
      checkFence({ lang: 'yaml', code: 'kind: A\nspec: {}\n---\nkind: B\nspec: {}\n' }),
    ).resolves.toMatchObject({ ok: true, tool: 'yaml' });
  });
  it('reports the first failing document in a yaml stream with its line', async () => {
    const result = await checkFence({ lang: 'yaml', code: 'a: 1\n---\nb: [1\n' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/^line 4: /);
  });

  it('skips languages with no checker', async () => {
    await expect(checkFence({ lang: 'bash', code: 'ls -l\n' })).resolves.toEqual({
      ok: true,
      skipped: true,
      tool: 'none',
    });
    await expect(checkFence({ lang: 'brainfuck', code: '++++.\n' })).resolves.toMatchObject({
      skipped: true,
      tool: 'none',
    });
  });

  it('skips go when gofmt is absent', async () => {
    const result = await withPath('', () =>
      checkFence({ lang: 'go', code: 'package main\nfunc main(){}\n' }),
    );
    expect(result).toEqual({ ok: true, skipped: true, tool: 'missing' });
  });
  it('reports go syntax errors through gofmt where it is installed', async () => {
    const result = await checkFence({ lang: 'go', code: 'package main\nfunc main() { fmt.Println(1 }\n' });
    if (result.skipped) return; // No Go toolchain here; the absent-tool path is covered above.
    expect(result).toMatchObject({ ok: false, tool: 'gofmt' });
    expect(result.error).toMatch(/line 2/);
  });
  it('skips every compiled language when its checker is absent', async () => {
    for (const lang of ['rust', 'java', 'cpp', 'csharp', 'swift', 'kotlin', 'php'])
      await expect(withPath('', () => checkFence({ lang, code: 'x\n' }))).resolves.toMatchObject({
        skipped: true,
        tool: 'missing',
      });
  });

  it('separates java syntax errors from fragment diagnostics', async () => {
    const broken = await checkFence({ lang: 'java', code: 'public class A { void f( { } }\n' });
    if (broken.tool === 'missing') return; // No JDK here; the absent-tool path is covered above.
    expect(broken).toMatchObject({ ok: false, tool: 'javac' });
    // A bare statement is an excerpt, not broken code, and neither is a missing import.
    await expect(checkFence({ lang: 'java', code: 'System.out.println(1);\n' })).resolves.toMatchObject({
      ok: true,
      skipped: true,
      tool: 'fragment',
    });
    await expect(
      checkFence({ lang: 'java', code: 'public class A { void f() { List<String> x = null; } }\n' }),
    ).resolves.toMatchObject({ skipped: true, tool: 'fragment' });
  });
  it('separates c++ syntax errors from fragment diagnostics', async () => {
    const broken = await checkFence({ lang: 'cpp', code: 'int main(){ return }\n' });
    if (broken.tool === 'missing') return; // No C++ compiler here.
    expect(broken).toMatchObject({ ok: false, tool: 'g++' });
    // A snippet missing its `#include` reports an unknown name, which says nothing about syntax.
    await expect(checkFence({ lang: 'cpp', code: 'int main(){ std::cout << 1; }\n' })).resolves.toMatchObject(
      { ok: true, skipped: true, tool: 'fragment' },
    );
  });
  it('treats a c++ loop outside any function as a fragment', async () => {
    // The C++ twin of Java's bare statement: `expected unqualified-id before 'for'` names
    // the missing enclosing scope, not a malformed loop.
    const result = await checkFence({ lang: 'cpp', code: 'for (int i = 0; i < 3; ++i) {\n  sum += i;\n}\n' });
    if (result.tool === 'missing') return; // No C++ compiler here.
    expect(result).toEqual({ ok: true, skipped: true, tool: 'fragment' });
  });

  it('reports placeholder-only fences as errors', async () => {
    for (const code of ['...', '…', '# ...', '// ...', '/* ... */', 'pass', 'TODO', '# ...\n// ...\n'])
      await expect(checkFence({ lang: 'python', code })).resolves.toMatchObject({
        ok: false,
        error: 'placeholder',
      });
  });
  it('reports placeholders regardless of language', async () => {
    await expect(checkFence({ lang: 'bash', code: '...\n' })).resolves.toMatchObject({
      error: 'placeholder',
    });
    await expect(checkFence({ lang: 'go', code: '// ...\n' })).resolves.toMatchObject({
      error: 'placeholder',
    });
  });
  it('allows elisions inside real code and flags them', async () => {
    await expect(
      checkFence({ lang: 'js', code: 'function f() {\n  ...\n  return 1;\n}\n' }),
    ).resolves.toMatchObject({ ok: true, elided: true });
    await expect(checkFence({ lang: 'python', code: 'def f():\n    ...\n\n\nf()\n' })).resolves.toMatchObject(
      { ok: true, elided: true },
    );
  });
  it('leaves elided undefined for ordinary code', async () => {
    expect(await checkFence({ lang: 'js', code: 'const a = 1;\n' })).not.toHaveProperty('elided');
  });

  it('skips shell and repl transcripts', async () => {
    await expect(checkFence({ lang: 'js', code: '$ node index.js\nhello\n' })).resolves.toEqual({
      ok: true,
      skipped: true,
      tool: 'repl',
    });
    await expect(checkFence({ lang: 'python', code: '>>> f(1)\n2\n>>> f(2)\n3\n' })).resolves.toMatchObject({
      skipped: true,
      tool: 'repl',
    });
    await expect(checkFence({ lang: 'js', code: '>>> 1 + 1\n2\n' })).resolves.toMatchObject({
      skipped: true,
      tool: 'repl',
    });
  });
  it('skips empty fences', async () => {
    await expect(checkFence({ lang: 'js', code: '\n  \n' })).resolves.toMatchObject({ skipped: true });
  });
});

describe('checkFences', () => {
  it('reports one result per fence with its opening line', async () => {
    const md = [
      '# Title',
      '',
      '```js',
      'const a = 1;',
      '```',
      '',
      'Prose.',
      '',
      '```py',
      'def f(:',
      '```',
      '',
      '```',
      'plain',
      '```',
      '',
    ].join('\n');
    const results = await checkFences(md);
    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject({ line: 3, lang: 'js', ok: true });
    expect(results[1]).toMatchObject({ line: 9, lang: 'py', ok: false });
    expect(results[1].error).toMatch(/line 1/);
    expect(results[2]).toMatchObject({ line: 13, lang: '', skipped: true });
  });
  it('returns an empty list for prose without fences', async () => {
    await expect(checkFences('Just prose.\n')).resolves.toEqual([]);
  });
});
