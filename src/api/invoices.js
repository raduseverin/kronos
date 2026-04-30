const k = () => window.kronos.invoices

export const invoices = {
  list:           ()           => k().list(),
  listForProject: (name)       => k().listForProject(name),
  nextNumber:     (name)       => k().nextNumber(name),
  create:         (data)       => k().create(data),
  update:         (id, data)   => k().update(id, data),
  delete:         (id)         => k().delete(id),
  timeSummary:    (f, t, pid)  => k().timeSummary(f, t, pid),
  exportPdf:      (data)       => k().exportPdf(data),
}
