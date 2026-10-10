import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

// Models that belong to a tenant. Any model with a `practiceId` column must be listed here.
export const TENANT_MODELS = new Set<string>(["User", "Patient", "Consent", "AuditLog"])

type Args = Record<string, unknown> & { where?: Record<string, unknown>; data?: unknown }

function scopeWhere(args: Args, practiceId: string) {
  args.where = { ...(args.where ?? {}), practiceId }
}

function withTenant<T>(data: T, practiceId: string): T {
  if (Array.isArray(data)) return data.map((d) => ({ ...d, practiceId })) as T
  return { ...(data as object), practiceId } as T
}

/**
 * Returns a Prisma client bound to one practice. Every read, update and delete on tenant models
 * is filtered by practiceId, and every create is stamped with it, so a query cannot reach another
 * practice's rows even if the caller forgets the filter.
 */
export function tenantDb(practiceId: string) {
  if (!practiceId) throw new Error("tenantDb requires a practiceId")
  return prisma.$extends({
    name: "tenant-isolation",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) return query(args)
          const a = (args ?? {}) as Args
          switch (operation) {
            case "findUnique":
            case "findUniqueOrThrow":
            case "findFirst":
            case "findFirstOrThrow":
            case "findMany":
            case "count":
            case "aggregate":
            case "groupBy":
            case "update":
            case "updateMany":
            case "delete":
            case "deleteMany":
              scopeWhere(a, practiceId)
              break
            case "create":
              a.data = withTenant(a.data, practiceId)
              break
            case "createMany":
            case "createManyAndReturn":
              a.data = withTenant(a.data, practiceId)
              break
            case "upsert":
              scopeWhere(a, practiceId)
              ;(a as Record<string, unknown>).create = withTenant((a as Record<string, unknown>).create, practiceId)
              break
            default:
              throw new Prisma.PrismaClientValidationError(`Operation ${operation} not allowed on tenant model ${model}`, {
                clientVersion: Prisma.prismaVersion.client,
              })
          }
          return query(a as typeof args)
        },
      },
    },
  })
}

export type TenantDb = ReturnType<typeof tenantDb>
