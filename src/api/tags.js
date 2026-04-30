const k = () => window.kronos.tags

export const tags = {
  list:   ()     => k().list(),
  create: (data) => k().create(data),
}
