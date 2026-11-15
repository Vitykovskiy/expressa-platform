import type {
  CustomerPickupSlots,
  PickupSlotsReader,
} from "./pickup-slots.types";

export class GetPickupSlotsUseCase {
  constructor(private readonly reader: PickupSlotsReader) {}

  execute(): Promise<CustomerPickupSlots> {
    return this.reader.readPickupSlots();
  }
}
