<template>
  <div class="equipment-grid">
    <div class="character-model-placeholder"></div>

    <draggable
      :list="headSlot"
      group="items"
      item-key="id"
      class="slot-container slot-l1"
      @change="handleChange($event, 'head')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Helm" :slot-key="'head'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.head"
          :item="null"
          label="Helm"
          :slot-key="'head'"
        />
      </template>
    </draggable>

    <draggable
      :list="chestSlot"
      group="items"
      item-key="id"
      class="slot-container slot-l2"
      @change="handleChange($event, 'chest')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Rüstung" :slot-key="'chest'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.chest"
          :item="null"
          label="Rüstung"
          :slot-key="'chest'"
        />
      </template>
    </draggable>

    <draggable
      :list="handsSlot"
      group="items"
      item-key="id"
      class="slot-container slot-l3"
      @change="handleChange($event, 'hands')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Handschuhe" :slot-key="'hands'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.hands"
          :item="null"
          label="Handschuhe"
          :slot-key="'hands'"
        />
      </template>
    </draggable>

    <draggable
      :list="feetSlot"
      group="items"
      item-key="id"
      class="slot-container slot-l4"
      @change="handleChange($event, 'feet')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Stiefel" :slot-key="'feet'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.feet"
          :item="null"
          label="Stiefel"
          :slot-key="'feet'"
        />
      </template>
    </draggable>

    <draggable
      :list="mainHandSlot"
      group="items"
      item-key="id"
      class="slot-container slot-l5"
      @change="handleChange($event, 'mainHand')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Haupthand" :slot-key="'mainHand'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.mainHand"
          :item="null"
          label="Haupthand"
          :slot-key="'mainHand'"
        />
      </template>
    </draggable>

    <draggable
      :list="offHandSlot"
      group="items"
      item-key="id"
      class="slot-container slot-l6"
      @change="handleChange($event, 'offHand')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Nebenhand" :slot-key="'offHand'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.offHand"
          :item="null"
          label="Nebenhand"
          :slot-key="'offHand'"
        />
      </template>
    </draggable>

    <draggable
      :list="cloakSlot"
      group="items"
      item-key="id"
      class="slot-container slot-r1"
      @change="handleChange($event, 'cloak')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Umhang" :slot-key="'cloak'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.cloak"
          :item="null"
          label="Umhang"
          :slot-key="'cloak'"
        />
      </template>
    </draggable>

    <draggable
      :list="neckSlot"
      group="items"
      item-key="id"
      class="slot-container slot-r2"
      @change="handleChange($event, 'neck')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Amulett" :slot-key="'neck'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.neck"
          :item="null"
          label="Amulett"
          :slot-key="'neck'"
        />
      </template>
    </draggable>

    <draggable
      :list="ring1Slot"
      group="items"
      item-key="id"
      class="slot-container slot-r3"
      @change="handleChange($event, 'ring1')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Ring" :slot-key="'ring1'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.ring1"
          :item="null"
          label="Ring"
          :slot-key="'ring1'"
        />
      </template>
    </draggable>

    <draggable
      :list="ring2Slot"
      group="items"
      item-key="id"
      class="slot-container slot-r4"
      @change="handleChange($event, 'ring2')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Ring" :slot-key="'ring2'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.ring2"
          :item="null"
          label="Ring"
          :slot-key="'ring2'"
        />
      </template>
    </draggable>

    <draggable
      :list="rangedMainSlot"
      group="items"
      item-key="id"
      class="slot-container slot-r5"
      @change="handleChange($event, 'rangedMain')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Fernkampf" :slot-key="'rangedMain'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.rangedMain"
          :item="null"
          label="Fernkampf"
          :slot-key="'rangedMain'"
        />
      </template>
    </draggable>

    <draggable
      :list="rangedOffSlot"
      group="items"
      item-key="id"
      class="slot-container slot-r6"
      @change="handleChange($event, 'rangedOff')"
    >
      <template #item="{ element }">
        <EquipmentSlot :item="element" label="Munition" :slot-key="'rangedOff'" />
      </template>
      <template #footer>
        <EquipmentSlot
          v-if="!gameStore.character.equipment.rangedOff"
          :item="null"
          label="Munition"
          :slot-key="'rangedOff'"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import draggable from 'vuedraggable'
import EquipmentSlot from './EquipmentSlot.vue'
import { useGameStore } from '../../stores/gameStore'

const gameStore = useGameStore()

const handleChange = (event, slotId) => {
  gameStore.handleEquipmentChange(slotId, event)
}

const createSlotComputed = (slotKey) => {
  return computed({
    // KORREKTUR: Greife direkt auf den reaktiven gameStore zu
    get: () =>
      gameStore.character.equipment[slotKey] ? [gameStore.character.equipment[slotKey]] : [],
    set: () => {},
  })
}

const headSlot = createSlotComputed('head')
const chestSlot = createSlotComputed('chest')
const handsSlot = createSlotComputed('hands')
const feetSlot = createSlotComputed('feet')
const mainHandSlot = createSlotComputed('mainHand')
const offHandSlot = createSlotComputed('offHand')
const cloakSlot = createSlotComputed('cloak')
const neckSlot = createSlotComputed('neck')
const ring1Slot = createSlotComputed('ring1')
const ring2Slot = createSlotComputed('ring2')
const rangedMainSlot = createSlotComputed('rangedMain')
const rangedOffSlot = createSlotComputed('rangedOff')
</script>

<style scoped>
.equipment-grid {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(9, 1fr);
  gap: 10px;
  align-items: center;
  justify-items: center;
}

.slot-container {
  width: 70px;
  height: 70px;
}

.character-model-placeholder {
  grid-column: 3 / 9;
  grid-row: 1 / 10;
  background-color: rgba(0, 0, 0, 0.3);
  width: 100%;
  height: 100%;
  border-radius: 5px;
}

.slot-l1 {
  grid-area: 2 / 2 / 3 / 3;
}
.slot-l2 {
  grid-area: 3 / 2 / 4 / 3;
}
.slot-l3 {
  grid-area: 4 / 2 / 5 / 3;
}
.slot-l4 {
  grid-area: 5 / 2 / 6 / 3;
}
.slot-l5 {
  grid-area: 7 / 2 / 8 / 3;
}
.slot-l6 {
  grid-area: 8 / 2 / 9 / 3;
}
.slot-r1 {
  grid-area: 2 / 9 / 3 / 10;
}
.slot-r2 {
  grid-area: 3 / 9 / 4 / 10;
}
.slot-r3 {
  grid-area: 4 / 9 / 5 / 10;
}
.slot-r4 {
  grid-area: 5 / 9 / 6 / 10;
}
.slot-r5 {
  grid-area: 7 / 9 / 8 / 10;
}
.slot-r6 {
  grid-area: 8 / 9 / 9 / 10;
}
</style>
