/**
 * Static equipment catalog – the single source of truth for item validation & pricing.
 * Recipe names must match exactly what Unity sends.
 */

const EQUIPMENT_CATALOG = {
    hair: [
        { recipeName: 'MaleShortHair_Recipe', displayName: 'Male Short Hair', price: 20 },
        { recipeName: 'MaleHair1', displayName: 'Male Hair 1', price: 20 },
        { recipeName: 'MaleHair2', displayName: 'Male Hair 2', price: 20 },
        { recipeName: 'MaleHair3', displayName: 'Male Hair 3', price: 20 },
        { recipeName: 'MaleHairSlick01_Recipe', displayName: 'Male Hair Slick', price: 20 },
    ],
    top: [
        // Male Tops
        { recipeName: 'MaleShirt1', displayName: 'Male Shirt 1', price: 50 },
        { recipeName: 'MaleShirt2', displayName: 'Male Shirt 2', price: 50 },
        { recipeName: 'MaleShirt3', displayName: 'Male Shirt 3', price: 50 },
        { recipeName: 'MaleHoodie_Recipe', displayName: 'Male Hoodie', price: 50 },
        // Female Tops
        { recipeName: 'FemaleShirt1', displayName: 'Female Shirt 1', price: 50 },
        { recipeName: 'FemaleShirt2', displayName: 'Female Shirt 2', price: 50 },
        { recipeName: 'FemaleShirt3', displayName: 'Female Shirt 3', price: 50 },
        { recipeName: 'FemaleShirt 4', displayName: 'Female Shirt 4', price: 50 },
    ],
    bottom: [
        // Male Bottoms
        { recipeName: 'MalePants', displayName: 'Male Pants', price: 50 },
        { recipeName: 'MaleShorts1', displayName: 'Male Shorts 1', price: 50 },
        { recipeName: 'MaleShorts2', displayName: 'Male Shorts 2', price: 50 },
        { recipeName: 'MaleSweatPants_Recipe', displayName: 'Male Sweat Pants', price: 50 },
        // Female Bottoms
        { recipeName: 'FemalePants1', displayName: 'Female Pants 1', price: 50 },
        { recipeName: 'FemalePants2', displayName: 'Female Pants 2', price: 50 },
    ],
    shoes: [
        // Male Shoes
        { recipeName: 'TallShoes_Recipe', displayName: 'High Top Shoes', price: 50 },
        { recipeName: 'TallShoes_Black_Recipe', displayName: 'Black High Top Shoes', price: 50 },
        { recipeName: 'MaleRobe Shoes', displayName: 'Robe Shoes', price: 50 },
        // Female Shoes
        { recipeName: 'FemaleTallShoes_White', displayName: 'Female High Top Shoes', price: 50 },
        { recipeName: 'FemaleTallShoes_Black', displayName: 'Female Black High Top Shoes', price: 50 },
        { recipeName: 'FemaleTallShoes_Turquoise', displayName: 'Female Turquoise High Top Shoes', price: 50 },
    ],
};

/**
 * Look up an item across ALL categories by its recipeName.
 * Returns { category, item } or null if not found.
 */
function findItemByRecipeName(recipeName) {
    for (const [category, items] of Object.entries(EQUIPMENT_CATALOG)) {
        const item = items.find(i => i.recipeName === recipeName);
        if (item) return { category, item };
    }
    return null;
}

module.exports = { EQUIPMENT_CATALOG, findItemByRecipeName };
