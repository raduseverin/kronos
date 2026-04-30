const k = () => window.kronos.idle

export const idle = {
  configure: (config) => k().configure(config),
  resume:    ()       => k().resume(),
}
