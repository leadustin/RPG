// src/components/character_sheet/InventoryItem.js

import React from "react"; // useState und useRef sind hier nicht mehr nötig
import { useDrag } from "react-dnd";
import { ItemTypes } from "../../dnd/itemTypes";
import Tooltip from "../tooltip/Tooltip"; // Dein Tooltip-Wrapper

const getIcon = (iconName) => {
  try {
    return require(`../../assets/images/icons/${iconName}`);
  } catch (err) {
    console.warn(`Icon not found: ${iconName}`);
    return "https://placeholder.pics/svg/40x40";
  }
};

const InventoryItem = ({ item }) => {
  // const [showTooltip, setShowTooltip] = useState(false); // ENTFERNT - Tooltip.js verwaltet das
  // const itemRef = useRef(null); // ENTFERNT - drag-Ref reicht aus
  const itemType = item ? item.type.toUpperCase() : "ITEM";

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes[itemType] || ItemTypes.ITEM,
    item: { ...item },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  /*
  // combinedRef ist nicht mehr nötig, wir übergeben 'drag' direkt
  const combinedRef = (el) => {
    drag(el);
    itemRef.current = el;
  };
  */

  if (!item) {
    return <div className="inventory-slot"></div>;
  }

  // Das ist das Element, das wir anzeigen, ziehen UND mit einem Tooltip versehen wollen
  const inventorySlotDiv = (
    <div
      ref={drag} // Wir übergeben die drag-Ref direkt hier
      className="inventory-slot"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
      // onMouseEnter/onMouseLeave ENTFERNT. Das macht jetzt der Tooltip-Wrapper.
    >
      <img src={getIcon(item.icon)} alt={item.name} className="item-icon" />
    </div>
  );

  // KORREKTUR:
  // Wir rendern den Tooltip-Wrapper NUR, wenn wir NICHT ziehen.
  // Wenn wir ziehen, rendern wir nur den nackten Div.
  // Wenn wir nicht ziehen, wickeln wir den Div in den Tooltip.
  return isDragging ? (
    inventorySlotDiv
  ) : (
    <Tooltip item={item}>
      {inventorySlotDiv}
    </Tooltip>
  );
};

export default InventoryItem;