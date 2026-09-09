'use client';

import { useEffect, useState } from 'react';

const themes = [
  { id: 'maroon', label: 'Maroon', colour: '#6f213b' },
  { id: 'rose', label: 'Rose', colour: '#a23f55' },
  { id: 'plum', label: 'Plum', colour: '#59304f' },
] as const;
type Theme = typeof themes[number]['id'];

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('maroon');

  useEffect(() => {
    const saved = window.localStorage.getItem('wedconnect-theme');
    const initial = themes.some((item) => item.id === saved) ? saved as Theme : 'maroon';
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('wedconnect-theme', next);
  }

  return <aside className={`theme-switcher ${open ? 'open' : ''}`} aria-label="Choose website colour">
    <button className="theme-trigger" type="button" onClick={() => setOpen(!open)} aria-expanded={open}><span style={{ background: themes.find((item) => item.id === theme)?.colour }}/><b>Colours</b></button>
    {open && <div className="theme-panel"><div><strong>Choose a colour</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close colour selector">×</button></div><p>Preview the brand palette across every page.</p>{themes.map((item) => <button className={theme === item.id ? 'selected' : ''} type="button" onClick={() => choose(item.id)} key={item.id}><span style={{ background: item.colour }}/><b>{item.label}</b><small>{theme === item.id ? 'Selected' : 'Preview'}</small></button>)}</div>}
  </aside>;
}
