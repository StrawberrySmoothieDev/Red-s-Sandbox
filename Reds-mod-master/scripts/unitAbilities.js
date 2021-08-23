const armor = extendContent(UnitType, "armor", {});
/*T1 unit used as template for Burner/inferno*/
armor.constructor = () => {
const unit = extend(UnitEntity, {
})
return unit
}
armor.abilities.add(new ForceFieldAbility(30, 5, 100, 1200));

const bulwark = extendContent(UnitType, "bulwark", {});
/*T2 unit*/
bulwark.constructor = () => {
const unit = extend(UnitEntity, {
})
return unit
}
bulwark.abilities.add(new ForceFieldAbility(50, 6, 150, 1200));

const chestplate = extendContent(UnitType, "chestplate", {});
/*T3 unit*/
chestplate.constructor = () => {
const unit = extend(UnitEntity, {
})
return unit
}
chestplate.abilities.add(new ForceFieldAbility(70, 7, 220, 1200));

const chainmail = extendContent(UnitType, "chainmail", {});
/*T4 unit with heal field*/
chainmail.constructor = () => {
const unit = extend(UnitEntity, {
})
return unit
}
chainmail.abilities.add(new ForceFieldAbility(120, 7, 220, 1200), new RepairFieldAbility(90, 60, 140));

const broadsword = extendContent(UnitType, "broadsword", {});
/*T5 unit with heal field*/
broadsword.constructor = () => {
const unit = extend(UnitEntity, {
})
return unit
}
broadsword.abilities.add(new ForceFieldAbility(160, 8, 220, 1200), new RepairFieldAbility(120, 80, 210));
