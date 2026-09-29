import { z } from "zod/v4";

import type { MobileBleService } from "@matreshka/shared/types/mobile-ble-services";

export const mobileBleServicesSchema: z.ZodType<MobileBleService[]> = z.array(
  z
    .object({
      uuid: z.string(),
      characteristics: z.array(
        z
          .object({
            uuid: z.string(),
            properties: z
              .object({
                broadcast: z.boolean().optional(),
                read: z.boolean().optional(),
                writeWithoutResponse: z.boolean().optional(),
                write: z.boolean().optional(),
                notify: z.boolean().optional(),
                indicate: z.boolean().optional(),
                authenticatedSignedWrites: z.boolean().optional(),
                reliableWrite: z.boolean().optional(),
                writableAuxiliaries: z.boolean().optional(),
                extendedProperties: z.boolean().optional(),
                notifyEncryptionRequired: z.boolean().optional(),
                indicateEncryptionRequired: z.boolean().optional(),
              })
              .passthrough(),
            descriptors: z.array(z.object({ uuid: z.string() })),
          })
          .passthrough(),
      ),
    })
    .passthrough(),
);
