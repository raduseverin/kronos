const k = () => window.kronos.clients

export const clients = {
  list:   ()        => k().list(),
  create: (data)    => k().create(data),
  update: (id, d)   => k().update(id, d),
  delete: (id)      => k().delete(id),
}
