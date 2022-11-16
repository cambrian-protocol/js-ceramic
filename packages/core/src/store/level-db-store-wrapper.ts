import levelTs from 'level-ts'
import type Level from 'level-ts'
import sublevel from 'sublevel'
import { StoreWrapperInterface, StoreSearchParams } from './store-wrapper-interface.js'
import path from 'path'
import * as fs from 'fs'
import { Networks } from '@ceramicnetwork/common'

// When Node.js imports a CJS module from ESM, it considers whole contents of `module.exports` as ESM default export.
// 'level-ts' is a CommomJS module, which exports Level constructor as `exports.default`.
// This `default` name has no special meaning from ESM perspective. It is just yet another name.
// Types provided by level-ts though make it appear as ESM default.
//
// So, here we untangle this mess, even if ugly.
// We import type information separately from code information, and then make sure we can access
// a properly typed constructor of `Level` (thus `LevelC`) exported from level-ts package.
//
// See also https://github.com/nodejs/node/blob/master/doc/api/esm.md#commonjs-namespaces,
const LevelC = (levelTs as any).default as unknown as typeof Level

export class LevelDbStoreWrapper implements StoreWrapperInterface {
  readonly networkName: string
  readonly #storeRoot: string
  store: Level
  #subStores: Record<string, Level> = {}

  constructor(storeRoot: string, networkName: string) {
    this.networkName = networkName
    this.#storeRoot = storeRoot
    const storePath = path.join(
      this.#storeRoot,
      // We want ELP and Mainnet to share data
      this.networkName === Networks.MAINNET ? Networks.ELP : this.networkName
    )
    if (fs) {
      fs.mkdirSync(storePath, { recursive: true }) // create dir if it doesn't exist
    }
    this.store = new LevelC(storePath)
  }

  private getStore(subChannel?: string) {
    if (subChannel) {
      if (!this.#subStores[subChannel]) {
        this.#subStores[subChannel] = new LevelC(sublevel(this.store, subChannel))
      }
      return this.#subStores[subChannel]
    } else {
      return this.store
    }
  }

  private throwIfNotInitialized(): void {
    if (!this.store) throw new Error('You must call async init(), before you start using the LevelStore')
  }

  async del(key: string, subChannel?: string): Promise<void> {
    this.throwIfNotInitialized()
    await this.getStore(subChannel).del(key)
  }

  async get(key: string, subChannel?: string): Promise<any> {
    this.throwIfNotInitialized()
    return await this.getStore(subChannel).get(key)
  }

  async isEmpty(params?: StoreSearchParams): Promise<boolean> {
    this.throwIfNotInitialized()
    const result = await this.find({
      limit: params?.limit ?? 1,
    })
    return result.length > 0
  }

  async find(params?: StoreSearchParams): Promise<Array<any>> {
    this.throwIfNotInitialized()
    const seachParams: Record<string, any> = {
      keys: true,
      values: false,
      limit: params?.limit
    }

    // The return type of .stram is Array<{ key: , value: }>, but if values: false is used in params, then it actually returns Array<string>
    return (await this.getStore(params?.subChannel).stream(seachParams)) as unknown as Array<string>
  }

  async put(key: string, value: any, subChannel?: string): Promise<void> {
    this.throwIfNotInitialized()
    return await this.getStore(subChannel).put(key, value)
  }

  async close(): Promise<void> {
    this.throwIfNotInitialized()
    // do nothing
    return
  }
}