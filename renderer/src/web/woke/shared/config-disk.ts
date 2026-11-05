// The settings as they go to the file: a popup is never recorded as open, or it
// would show again at the next start. Kept free of imports so tests can load it.
export function configForDisk (config: { widgets: Array<{ wmZorder: unknown, wmWants: unknown }> }): string {
  return JSON.stringify({
    ...config,
    widgets: config.widgets.map(w => w.wmZorder === 'exclusive' && w.wmWants === 'show' ? { ...w, wmWants: 'hide' } : w)
  })
}
