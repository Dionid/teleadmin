import {
  EventBusBehaviour,
  EventBus,
  EventBusService
} from "libs/@fdd/eda";

import {EventBusInMemory, EventBusInMemoryService} from "./index";

const eventBusInmemory = EventBusInMemory.new()

const onEventHandler = EventBusInMemory.subscribeC("", async (event) => {
  return
})

const someFn = (
  eventBusData: EventBus,
) => {
  onEventHandler(eventBusInmemory)
  EventBusInMemory.subscribeC("", async (event) => {
    return
  })(eventBusInmemory)
}

someFn(
  eventBusInmemory,
)

const someFnS = <EBD extends EventBus>(
  eventBusD: EBD,
  eventBusB: EventBusBehaviour<EBD>,
) => {
  eventBusB.subscribeC("", async (event) => {
    return
  })(eventBusD)
}

someFnS(
  eventBusInmemory,
  EventBusInMemory,
)

const someFnT = (
  eventBusService: EventBusService,
) => {
  eventBusService.subscribe("", async() => {

  })
}

const eventBusInmemoryService = EventBusInMemoryService.new(eventBusInmemory)

someFnT(eventBusInmemoryService)

