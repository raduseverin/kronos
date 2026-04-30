const k = () => window.kronos.templates

export const templates = {
  list:   ()       => k().list(),
  create: (data)   => k().create(data),
  delete: (id)     => k().delete(id),
}
