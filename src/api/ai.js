const k = () => window.kronos.ai

export const ai = {
  configure:          (config)      => k().configure(config),
  isAvailable:        ()            => k().isAvailable(),
  suggestDescription: (text)        => k().suggestDescription(text),
  classifyWindow:     (windowTitle) => k().classifyWindow(windowTitle),
}
