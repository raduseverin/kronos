const k = () => window.kronos.reports

export const reports = {
  summary:   (from, to, filters) => k().summary(from, to, filters),
  exportCsv: (from, to)          => k().exportCsv(from, to),
}
