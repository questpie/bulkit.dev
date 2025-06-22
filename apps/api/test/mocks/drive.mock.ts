import { driveManager, type Drive } from '@bulkit/api/drive/drive'
import { ioc } from '@bulkit/api/ioc'

export const injectMockDrive = ioc.register('drive', () => {
  return driveManager.fake() as Drive
})
