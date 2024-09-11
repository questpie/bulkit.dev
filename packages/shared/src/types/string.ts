export type Capitalize<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Capitalize<First>}${Rest}`
  : T
