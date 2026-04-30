const k = () => window.kronos.rules

export const rules = {
  list:   ()      => k().list(),
  create: (data)  => k().create(data),
  delete: (id)    => k().delete(id),
}
