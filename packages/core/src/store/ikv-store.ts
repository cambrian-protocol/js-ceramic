export type StoreSearchParams = {
  limit?: number
  gt?: string
  useCaseName?: string
}

export type IKVStoreFindResult = {
  key: string
  value: any
}

export interface IKVStore {
  networkName: string

  close(useCaseName?: string): Promise<void>
  isEmpty(params?: StoreSearchParams): Promise<boolean>
  findKeys(params?: StoreSearchParams): Promise<Array<string>>
  find(params?: StoreSearchParams): Promise<Array<IKVStoreFindResult>>
  exists(key: string, useCaseName?: string): Promise<boolean>
  put(key: string, value: any, useCaseName?: string): Promise<void>
  get(key: string, useCaseName?: string): Promise<any>
  del(key: string, useCaseName?: string): Promise<void>
}
