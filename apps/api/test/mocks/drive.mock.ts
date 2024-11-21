import { driveManager, type Drive } from '@bulkit/api/drive/drive'
import { iocRegister } from '@bulkit/api/ioc'

export const injectMockDrive = iocRegister('drive', () => {
  return driveManager.fake() as Drive
})
