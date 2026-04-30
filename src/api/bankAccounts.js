const k = () => window.kronos.bankAccounts

export const bankAccounts = {
  list:   ()       => k().list(),
  create: (data)   => k().create(data),
  update: (id, d)  => k().update(id, d),
  delete: (id)     => k().delete(id),
}
