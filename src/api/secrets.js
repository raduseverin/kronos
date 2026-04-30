const k = () => window.kronos.secrets

export const secrets = {
  /** @returns {Promise<string>} */
  get:       (key)         => k().get(key),
  set:       (key, value)  => k().set(key, value),
  setMany:   (entries)     => k().setMany(entries),
  /** @returns {Promise<boolean>} */
  available: ()            => k().available(),
}
