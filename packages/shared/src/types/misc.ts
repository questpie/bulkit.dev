export type WithAutocomplete<T, P = string> = T | (P & Record<never, never>)
export type StringWithAutocomplete<T> = WithAutocomplete<T>

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type MaybePromise<T> = T | Promise<T>

export type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

export type Defined<T> = T extends undefined ? never : T
