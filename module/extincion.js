// Import Modules
import { extincionActor } from "./actor/actor.js";
import { extincionActorSheet } from "./actor/actor-sheet.js";
import { extincionItem } from "./item/item.js";
import { extincionItemSheet } from "./item/item-sheet.js";

async function preloadHandlebarsTemplates() {
  const templatePaths = [
    'systems/extincion/templates/actor/sub-talents.hbs',
    'systems/extincion/templates/actor/sub-items.hbs'
  ];
  return loadTemplates(templatePaths);
};

Hooks.once('init', async function() {

  game.extincion = {
    extincionActor,
    extincionItem
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = extincionActor;
  CONFIG.Item.entityClass = extincionItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("extincion", extincionActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("extincion", extincionItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });

  preloadHandlebarsTemplates();
});

/**
 * Highlight critical success or failure on d20 rolls
 */
Hooks.on("renderChatMessage", (message, html, data) => {

  let tmp = message.data.flags[0];
  message.data.content = message.data.flags[0];
  message.data.actor = game.actors.get(message.data.flags[1]);

  if (message.data.content == undefined) message.data.content = tmp

  // html.find(".message-sender").text(message.data.actor.name);

  if (!message.isRoll | message.data.content == "undefined") return;

  // si es una tirada de daño.
  if (message.data.content == "damagemin" || message.data.content == "damageval") {
    html.find(".dice-formula").addClass("dice-tooltip");
    html.find(".dice-formula").text(strFormula);
    html.find(".dice-total").text(`${game.i18n.localize("EXTINCION.DamagePoints")}: ${message.roll.total}`);
    return
  }

  // si es una tirada de adrenalina
  if (message.data.content == "adrenaline" || message.data.content.includes("usedice")) {
    if (message.roll.total <= 2) {
      html.find(".dice-total").addClass("failure");
      if (message.data.content.includes("adrenaline")) str = game.i18n.localize("EXTINCION.AdrenalineFailure");
      if (message.data.content.includes("usedice")) str = game.i18n.localize("EXTINCION.UseDiceFailure");
      // html.append("Pierdes Adrenalina!");
    } else if (message.roll.total > 2) {
      html.find(".dice-total").addClass("success");
      if (message.data.content.includes("adrenaline")) str = game.i18n.localize("EXTINCION.AdrenalineSuccess");
      if (message.data.content.includes("usedice")) str = game.i18n.localize("EXTINCION.UseDiceSuccess");
    }
    html.find(".dice-formula").addClass("dice-tooltip");
    html.find(".dice-formula").text(strFormula);
    html.find(".dice-total").text(str.toString());
    html.find(".dice-total").html(`<li class="extincion-rolls ${message.roll._formula}">${message.roll.total}</li> ${str.toString()}`); //<--------- TODO?
    return
  }

  // si no tenemos actor, salimos.
  if (message.data.actor === undefined) return;

  // Si es una tirada de habilidades
  var val = message.data.actor.data.data.abilities[message.data.content].value;
  var val_oper = val - message.roll.total;
  var str = `${html.find(".dice-formula").text()} - ${val}(${message.data.content})`;
  var strFormula = `${message.roll.total} | ${val}(${message.data.content})`;

  // Si es una tirada de habilidades
  if (message.roll.total == 1) {
    html.find(".dice-total").addClass("success");
    str = game.i18n.localize("EXTINCION.crit");
  } else if (message.roll.total == 20) {
    html.find(".dice-total").addClass("failure");
    str = game.i18n.localize("EXTINCION.flaw");
  } else if (val_oper > 0) {
    html.find(".dice-total").addClass("success");
    str = game.i18n.localize("EXTINCION.success");
  } else if (val_oper <= 0) {
    html.find(".dice-total").addClass("failure");
    str = game.i18n.localize("EXTINCION.failure");
  }
  delete data.message.content;

  html.find(".dice-formula").addClass("dice-tooltip");
  html.find(".dice-formula").text(strFormula);
  html.find(".dice-total").html(`<li class="extincion-rolls d${message.roll.dice[0].faces}">${message.roll.total}</li> ${str.toString()}`);

  // html.append("<div class=\"success\">Probando tirada</div>");
});