import { secretsService } from '../services/secretsService.js'

export function registerSecretsHandlers(ipcMain) {
  ipcMain.handle('secrets:get',      (_e, key)         => secretsService.get(key))
  ipcMain.handle('secrets:set',      (_e, key, value)  => secretsService.set(key, value))
  ipcMain.handle('secrets:set-many', (_e, entries)     => secretsService.setMany(entries))
  ipcMain.handle('secrets:available', ()               => secretsService.isEncryptionAvailable())
}
