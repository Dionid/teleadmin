import {EventBusBehaviour, EventBusData, EventBusService} from "libs/@fdd/eda/event-bus";
import {EventBusInmemory, EventBusInmemoryService} from "libs/@fdd/eda/event-bus-inmemory";

const eventBusInmemory = EventBusInmemory.new()

const onEventHandler = EventBusInmemory.subscribeC("", async (event) => {
  return
})

const someFn = (
  eventBusData: EventBusInmemory,
) => {
  onEventHandler(eventBusInmemory)
  EventBusInmemory.subscribeC("", async (event) => {
    return
  })(eventBusInmemory)
}

someFn(
  eventBusInmemory,
)

const someFnS = <EBD extends EventBusData>(
  eventBusD: EBD,
  eventBusB: EventBusBehaviour<EBD>,
) => {
  eventBusB.subscribeC("", async (event) => {
    return
  })(eventBusD)
}

someFnS(
  eventBusInmemory,
  EventBusInmemory,
)

const someFnT = (
  eventBusService: EventBusService,
) => {
  eventBusService.subscribe("", async() => {

  })
}

const eventBusInmemoryService = EventBusInmemoryService.new(eventBusInmemory)

someFnT(eventBusInmemoryService)

