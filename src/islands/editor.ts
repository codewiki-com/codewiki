import type { Extension } from '@codemirror/state';
import type { RunLang } from '@/lib/runners/protocol';

export interface MountedEditor {
  setValue(value: string): void;
  destroy(): void;
}

async function languageExtension(lang: RunLang): Promise<Extension> {
  switch (lang) {
    case 'python': {
      const { python } = await import('@codemirror/lang-python');
      return python();
    }
    case 'js': {
      const { javascript } = await import('@codemirror/lang-javascript');
      return javascript();
    }
    case 'ts': {
      const { javascript } = await import('@codemirror/lang-javascript');
      return javascript({ typescript: true });
    }
    case 'sql': {
      const { sql, SQLite } = await import('@codemirror/lang-sql');
      return sql({ dialect: SQLite });
    }
    case 'html': {
      const { html } = await import('@codemirror/lang-html');
      return html();
    }
  }
}

/**
 * Replaces the live fallback textarea with CodeMirror only after the reader focuses it. Core and
 * language support stay out of the initial page bundle, and each language remains its own chunk.
 */
export async function mountEditor(
  textarea: HTMLTextAreaElement,
  lang: RunLang,
  onChange: (value: string) => void,
): Promise<MountedEditor> {
  const [{ EditorState }, view, commands, language, { tags }, langExtension] = await Promise.all([
    import('@codemirror/state'),
    import('@codemirror/view'),
    import('@codemirror/commands'),
    import('@codemirror/language'),
    import('@lezer/highlight'),
    languageExtension(lang),
  ]);

  const {
    EditorView,
    drawSelection,
    dropCursor,
    highlightActiveLine,
    highlightActiveLineGutter,
    keymap,
    lineNumbers,
  } = view;
  const { defaultKeymap, history, historyKeymap, indentWithTab } = commands;
  const { HighlightStyle, bracketMatching, syntaxHighlighting } = language;

  const theme = EditorView.theme({
    '&': {
      height: '100%',
      minHeight: '470px',
      backgroundColor: 'var(--code-bg)',
      color: 'var(--code-ink)',
      fontFamily: 'var(--font-mono)',
      fontSize: '13.5px',
    },
    '&.cm-focused': { outline: '2px solid var(--acc)', outlineOffset: '-2px' },
    '.cm-scroller': { overflow: 'auto', lineHeight: '1.7' },
    '.cm-content': { padding: '16px 0', caretColor: 'var(--code-ink)' },
    '.cm-line': { padding: '0 18px 0 8px' },
    '.cm-gutters': {
      minWidth: '44px',
      padding: '16px 0',
      backgroundColor: 'var(--code-bg)',
      color: 'var(--astro-code-token-comment)',
      border: '0',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 10px', minWidth: '38px' },
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--code-line)' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--acc-soft)',
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--astro-code-token-function)' },
  });

  const highlights = HighlightStyle.define([
    { tag: tags.keyword, color: 'var(--astro-code-token-keyword)' },
    { tag: [tags.string, tags.special(tags.string)], color: 'var(--astro-code-token-string)' },
    {
      tag: [tags.function(tags.variableName), tags.definition(tags.variableName)],
      color: 'var(--astro-code-token-function)',
    },
    { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--astro-code-token-comment)' },
    { tag: [tags.number, tags.bool, tags.null], color: 'var(--astro-code-token-constant)' },
    { tag: [tags.operator, tags.punctuation], color: 'var(--astro-code-token-punctuation)' },
    { tag: tags.link, color: 'var(--astro-code-token-link)', textDecoration: 'underline' },
  ]);

  const host = document.createElement('div');
  host.className = 'playground-codemirror';
  textarea.insertAdjacentElement('afterend', host);
  textarea.hidden = true;

  const editor = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: textarea.value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        dropCursor(),
        bracketMatching(),
        highlightActiveLine(),
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
        langExtension,
        theme,
        syntaxHighlighting(highlights),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const value = update.state.doc.toString();
          textarea.value = value;
          onChange(value);
        }),
      ],
    }),
  });
  editor.focus();

  return {
    setValue(value) {
      if (editor.state.doc.toString() === value) return;
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
    },
    destroy() {
      editor.destroy();
      host.remove();
      textarea.hidden = false;
    },
  };
}
