import { describe, it, expect, vi } from 'vitest'

// `updater.ts` imports from 'electron', which is only available inside a
// running Electron process — stub it so we can unit-test the version logic.
vi.mock('electron', () => ({
  app: { name: 'omus', getVersion: () => '1.3.0' },
  dialog: {},
  shell: {},
  net: {},
  BrowserWindow: class {}
}))

// `electron-updater` is a thin wrapper around `electron` and only functions
// inside the packaged app — stub it so the module can be imported by vitest.
vi.mock('electron-updater', () => ({
  autoUpdater: {}
}))

import { parseVersion, isNewer } from '../../src/main/updater'

describe('parseVersion', () => {
  it('parses plain and "v"-prefixed semver strings', () => {
    expect(parseVersion('1.3.0')).toEqual([1, 3, 0])
    expect(parseVersion('v2.0.1')).toEqual([2, 0, 1])
  })

  it('strips prerelease suffixes and tolerates garbage', () => {
    expect(parseVersion('1.2.3-prerelease')).toEqual([1, 2, 3])
    expect(parseVersion('x.y.z')).toEqual([0, 0, 0])
    expect(parseVersion('')).toEqual([0])
  })
})

describe('isNewer', () => {
  it('reports updates for newer, older and equal versions', () => {
    expect(isNewer([1, 2, 3], [1, 2, 4])).toBe(true)
    expect(isNewer([1, 2, 4], [1, 2, 3])).toBe(false)
    expect(isNewer([1, 2, 3], [1, 2, 3])).toBe(false)
  })

  it('compares across different component counts', () => {
    expect(isNewer([1, 0], [1, 1])).toBe(true)
    expect(isNewer([2, 0], [1, 9, 9])).toBe(false)
    expect(isNewer([1, 3], [1, 3, 1])).toBe(true)
    expect(isNewer([1, 3, 1], [1, 3])).toBe(false)
  })
})