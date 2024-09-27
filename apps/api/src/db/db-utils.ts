import { type Column, type SQL, sql } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'

/**
 * Coalesce a value to a default value if the value is null
 * Ex default array: themes: coalesce(pubThemeListQuery.themes, sql`'[]'`)
 * Ex default number: votesCount: coalesce(PubPollAnswersQuery.count, sql`0`)
 */
export function coalesce<T>(...values: (SQL<T> | PgColumn | SQL.Aliased<T>)[]) {
  return sql<T>`coalesce(${sql.join(values, sql`, `)})`
}

export function concat<T = string>(...values: (SQL<T> | PgColumn | SQL.Aliased<T>)[]) {
  return sql<T>`concat(${sql.join(values, sql`, `)})`
}

type ColumnSelection = {
  [K in string]: SQL | Column
}

export type TSelectionResult<T extends ColumnSelection> = {
  [K in keyof T]: T[K] extends SQL<infer U> ? U : T[K] extends Column ? T[K]['_']['data'] : never
}

export type SelectRelatedEntitiesOpts<T extends PgTable, TSelection extends ColumnSelection> = {
  table: T
  select: TSelection
  where: SQL
  primaryKey?: Column
  limit?: number
}

export function selectRelatedEntities<T extends PgTable, TSelection extends ColumnSelection>(
  opts: SelectRelatedEntitiesOpts<T, TSelection>
) {
  const columnsToSelect = Object.entries(opts.select).map(
    ([alias, column]) =>
      sql`'${sql.raw(alias)}', ${column}` as SQL<TSelectionResult<TSelection>[keyof TSelection]>
  )

  return sql<TSelectionResult<TSelection>[]>`(
    SELECT COALESCE(json_agg(
      json_build_object(
        ${sql.join(columnsToSelect, sql`, `)}
      )
    ) FILTER (WHERE ${opts.primaryKey ?? (opts.table as any).id} IS NOT NULL), '[]'::json)
    FROM ${opts.table}
    WHERE ${opts.where}
    ${opts.limit ? sql`LIMIT ${opts.limit}` : sql``}
  )`
}
