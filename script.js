/**
 * Pizza Dough Calculator - Pure JavaScript
 * All calculations and DOM manipulation client-side, no external dependencies
 */

// ============================================
// STYLE DEFAULTS & PIZZA DESCRIPTIONS
// ============================================

const STYLE_DEFAULTS = {
    neapolitan: {
        name: 'Neapolitan',
        description: 'Soft, chewy, and slightly charred with a puffy crust. Uses long fermentation and high hydration.',
        hydration: 63,
        salt: 2,
        oil: 0,
        sugar: 0,
        yeastType: 'instant',
        yeastAmount: 0.2,
        fermentTime: 48,
        mixingMethod: 'by-hand',
        autolyse: false,
        ballWeight: 280,
        coldFerm: true,
        coldFermDays: 2
    },
    newyork: {
        name: 'New York',
        description: 'Large, thin crust with a crispy outside and chewy interior. Moderate hydration with moderate fermentation.',
        hydration: 63,
        salt: 2,
        oil: 1,
        sugar: 1,
        yeastType: 'active-dry',
        yeastAmount: 1,
        fermentTime: 24,
        mixingMethod: 'stand-mixer',
        autolyse: false,
        ballWeight: 350
    },
    roman: {
        name: 'Roman (Al Taglio)',
        description: 'Thick, rectangular focaccia-style pizza with an open crumb. High hydration, long cold fermentation.',
        hydration: 75,
        salt: 2,
        oil: 4,
        sugar: 0.5,
        yeastType: 'active-dry',
        yeastAmount: 0.3,
        fermentTime: 48,
        mixingMethod: 'stand-mixer',
        autolyse: true,
        ballWeight: 500
    },
    detroit: {
        name: 'Detroit',
        description: 'Rectangular pan pizza with crispy edges (frico) and airy interior. Moderate-high hydration.',
        hydration: 68,
        salt: 2,
        oil: 3,
        sugar: 0.5,
        yeastType: 'active-dry',
        yeastAmount: 1.5,
        fermentTime: 18,
        mixingMethod: 'stand-mixer',
        autolyse: false,
        ballWeight: 400
    },
    sourdough: {
        name: 'Sourdough',
        description: 'Complex flavor from natural fermentation. Requires sourdough starter and long, slow rise.',
        hydration: 70,
        salt: 2,
        oil: 0,
        sugar: 0,
        yeastType: 'sourdough-starter',
        yeastAmount: 100,
        fermentTime: 72,
        mixingMethod: 'by-hand',
        autolyse: true,
        ballWeight: 300
    }
};

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate flour weight based on total dough weight and hydration
 */
function calculateFlourWeight(totalWeight, hydration) {
    return totalWeight / (1 + hydration / 100);
}

/**
 * Calculate water weight based on flour weight and hydration
 */
function calculateWaterWeight(flourWeight, hydration) {
    return flourWeight * (hydration / 100);
}

/**
 * Calculate ingredient weight as percentage of flour
 */
function calculateIngredientWeight(flourWeight, percentage) {
    return flourWeight * (percentage / 100);
}

/**
 * Convert yeast between types (grams)
 * Reference conversions:
 * - 1g instant = 1.25g active dry = 3g fresh = 2g sourdough starter
 */
function convertYeast(amount, fromType, toType) {
    if (fromType === toType) return amount;

    const conversions = {
        'active-dry': 1,
        'instant': 0.8,
        'fresh': 0.333,
        'sourdough-starter': 0.5
    };

    const normalizedAmount = amount / conversions[fromType];
    return normalizedAmount * conversions[toType];
}

/**
 * Get yeast conversions in all formats for display
 */
function getYeastConversions(amount, currentType) {
    return {
        'active-dry': convertYeast(amount, currentType, 'active-dry'),
        'instant': convertYeast(amount, currentType, 'instant'),
        'fresh': convertYeast(amount, currentType, 'fresh'),
        'sourdough-starter': convertYeast(amount, currentType, 'sourdough-starter')
    };
}

/**
 * Estimate pizza diameter in inches from dough ball weight
 * Accounts for dough expansion during fermentation and baking
 * Formula: diameter = 1 + (weight / 25), adjusted for typical rise
 */
function estimatePizzaDiameter(ballWeight) {
    // Empirically derived: a 280g ball yields ~12" pizza
    const diameterInches = 1 + ballWeight / 25;
    return diameterInches;
}

/**
 * Convert Celsius to Fahrenheit
 */
function celsiusToFahrenheit(c) {
    return (c * 9) / 5 + 32;
}

/**
 * Convert Fahrenheit to Celsius
 */
function fahrenheitToCelsius(f) {
    return ((f - 32) * 5) / 9;
}

/**
 * Adjust fermentation time based on room temperature
 * Uses simplified temperature coefficient
 */
function adjustFermentationTime(baseHours, baseTemp, actualTemp) {
    const tempDiff = actualTemp - baseTemp;
    const coefficient = 1 - tempDiff * 0.05;
    return Math.max(4, baseHours * coefficient);
}

/**
 * Calculate recommended yeast quantity based on fermentation conditions
 * Scales yeast based on number of dough balls (0.2g per ball base)
 */
function calculateRecommendedYeast(numBalls, isColdFerm) {
    // Primary: 0.4g per dough ball (scales linearly)
    let scaled = numBalls * 0.4;

    // Cold fermentation significantly reduces yeast needs (halve it)
    if (isColdFerm) {
        scaled *= 0.5;
    }

    // Cap at 10g
    scaled = Math.min(10, scaled);

    return Math.round(scaled * 10) / 10;
}

/**
 * Get autolyse recommendation based on hydration and style
 */
function getAutolyseSuggestion(hydration, style) {
    if (hydration >= 70) {
        return 'Recommended: High hydration benefits from autolyse to improve extensibility.';
    }
    if (hydration < 60) {
        return 'Optional: Lower hydration doughs need less help developing gluten.';
    }
    return 'Recommended: Autolyse helps develop gluten structure for this dough.';
}

// ============================================
// TEMPERATURE UTILITIES
// ============================================

const tempState = {
    waterTempUnit: 'celsius',
    roomTempUnit: 'celsius'
};

function toggleTempUnit(elementId, currentUnit) {
    const newUnit = currentUnit === 'celsius' ? 'fahrenheit' : 'celsius';
    const input = document.getElementById(elementId.replace('Unit', ''));
    const currentValue = parseFloat(input.value);

    let newValue;
    if (currentUnit === 'celsius') {
        newValue = celsiusToFahrenheit(currentValue);
    } else {
        newValue = fahrenheitToCelsius(currentValue);
    }

    input.value = Math.round(newValue * 10) / 10;

    if (elementId === 'waterTempUnit') {
        tempState.waterTempUnit = newUnit;
        document.getElementById('waterTempUnit').textContent =
            newUnit === 'celsius' ? '°C' : '°F';
    } else {
        tempState.roomTempUnit = newUnit;
        document.getElementById('roomTempUnit').textContent =
            newUnit === 'celsius' ? '°C' : '°F';
    }

    renderRecipe();
}

// ============================================
// SLIDER & NUMBER INPUT SYNC
// ============================================

function syncSliderAndInput(sliderId, inputId) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);

    if (!slider || !input) return;

    const syncSliderToInput = () => {
        input.value = slider.value;
        renderRecipe();
    };

    const syncInputToSlider = () => {
        let value = parseFloat(input.value);
        value = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), value));
        slider.value = value;
        input.value = value;
        renderRecipe();
    };

    slider.addEventListener('input', syncSliderToInput);
    input.addEventListener('input', syncInputToSlider);
}

// ============================================
// RECIPE RENDERING
// ============================================

function renderRecipe(skipYeastCalculation = false) {
    // Get all current input values
    const style = document.querySelector('.style-btn.active')?.dataset.style || 'neapolitan';
    const numBalls = parseInt(document.getElementById('numBalls').value);
    const ballWeight = parseFloat(document.getElementById('ballWeight').value);
    const hydration = parseFloat(document.getElementById('hydration').value);
    const salt = parseFloat(document.getElementById('salt').value);
    const oil = parseFloat(document.getElementById('oil').value);
    const sugar = parseFloat(document.getElementById('sugar').value);
    const yeastType = document.getElementById('yeastType').value;
    const yeastAmount = parseFloat(document.getElementById('yeastAmount').value);
    const waterTemp = parseFloat(document.getElementById('waterTemp').value);
    const roomTemp = parseFloat(document.getElementById('roomTemp').value);
    const isColdFerm = document.getElementById('coldFerm').checked;
    const coldFermDays = isColdFerm ? parseInt(document.getElementById('coldFermDaysInput').value) : 0;
    const fermentTime = parseFloat(document.getElementById('fermentTime').value);
    const mixingMethod = document.getElementById('mixingMethod').value;
    const hasAutolyse = document.getElementById('autolyseTgl').checked;

    // Calculate total dough weight
    const totalDoughWeight = numBalls * ballWeight;
    const flourWeight = calculateFlourWeight(totalDoughWeight, hydration);
    const waterWeight = calculateWaterWeight(flourWeight, hydration);
    const saltWeight = calculateIngredientWeight(flourWeight, salt);
    const oilWeight = calculateIngredientWeight(flourWeight, oil);
    const sugarWeight = calculateIngredientWeight(flourWeight, sugar);

    // Calculate recommended yeast based on fermentation conditions (unless skipped)
    let finalYeast = yeastAmount;
    if (!skipYeastCalculation) {
        const recommendedYeast = calculateRecommendedYeast(numBalls, isColdFerm);
        finalYeast = recommendedYeast;

        // Update the yeast input value to the calculated recommendation
        document.getElementById('yeastAmount').value = recommendedYeast;
        document.getElementById('yeastSlider').value = recommendedYeast;

        // Display the calculated suggestion
        document.getElementById('yeastSuggestedAmount').textContent = `(Calculated: ${recommendedYeast.toFixed(2)}g)`;
    }

    // Calculate pizza diameter
    const pizzaDiameter = estimatePizzaDiameter(ballWeight);

    // Update summary card
    updateSummaryCard(totalDoughWeight, numBalls, ballWeight, pizzaDiameter);

    // Update ingredients table
    updateIngredientsTable(flourWeight, waterWeight, saltWeight, oilWeight, sugarWeight, finalYeast, yeastType);

    // Update yeast conversions
    updateYeastConversions(finalYeast, yeastType);

    // Update helper texts
    updateHelperTexts(pizzaDiameter, hydration, style, waterTemp, roomTemp);

    // Generate instructions
    generateInstructions(
        hasAutolyse,
        mixingMethod,
        hydration,
        ballWeight,
        roomTemp,
        waterTemp
    );

    // Generate fermentation schedule
    generateFermentationSchedule(
        fermentTime,
        roomTemp,
        isColdFerm,
        coldFermDays,
        finalYeast
    );
}

function updateSummaryCard(totalWeight, numBalls, ballWeight, diameter) {
    document.getElementById('totalWeight').textContent = `${totalWeight.toFixed(0)}g`;
    document.getElementById('summaryBalls').textContent = `${numBalls}`;
    document.getElementById('summaryBallWeight').textContent = `${ballWeight.toFixed(0)}g`;
    document.getElementById('summaryDiameter').textContent = `${diameter.toFixed(1)}"`;
}

function updateIngredientsTable(flour, water, salt, oil, sugar, yeast, yeastType) {
    const totalWeight = flour + water + salt + oil + sugar + yeast;
    const tbody = document.getElementById('ingredientsList');
    tbody.innerHTML = '';

    const ingredients = [
        { name: 'Bread Flour', weight: flour },
        { name: 'Water', weight: water },
        { name: 'Salt', weight: salt },
        ...(oil > 0.1 ? [{ name: 'Olive Oil', weight: oil }] : []),
        ...(sugar > 0.1 ? [{ name: 'Sugar', weight: sugar }] : []),
        { name: getYeastLabel(yeastType), weight: yeast }
    ];

    ingredients.forEach((ing) => {
        const percentage = (ing.weight / flour) * 100;
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = ing.name;

        const weightCell = document.createElement('td');
        weightCell.className = 'ingredient-weight';
        weightCell.textContent = ing.weight.toFixed(1);

        const percentCell = document.createElement('td');
        percentCell.className = 'ingredient-percent';
        percentCell.textContent = percentage.toFixed(1) + '%';

        row.appendChild(nameCell);
        row.appendChild(weightCell);
        row.appendChild(percentCell);
        tbody.appendChild(row);
    });
}

function getYeastLabel(yeastType) {
    const labels = {
        'active-dry': 'Active Dry Yeast',
        'instant': 'Instant Yeast',
        'fresh': 'Fresh Yeast',
        'sourdough-starter': 'Sourdough Starter'
    };
    return labels[yeastType] || 'Yeast';
}

function updateYeastConversions(amount, currentType) {
    const conversions = getYeastConversions(amount, currentType);
    const parts = [
        `Active Dry: ${conversions['active-dry'].toFixed(1)}g`,
        `Instant: ${conversions['instant'].toFixed(1)}g`,
        `Fresh: ${conversions['fresh'].toFixed(1)}g`,
        `Sourdough Starter: ${conversions['sourdough-starter'].toFixed(0)}g`
    ];
    document.getElementById('yeastReference').textContent = parts.join(' • ');
}

function updateHelperTexts(diameter, hydration, style, waterTemp, roomTemp) {
    // Diameter helper
    document.getElementById('diameterHelper').textContent = `Estimated pizza diameter: ${diameter.toFixed(1)}" (${(diameter * 2.54).toFixed(0)}cm)`;

    // Yeast conversion helper
    const yeastType = document.getElementById('yeastType').value;
    const yeastAmount = parseFloat(document.getElementById('yeastAmount').value);
    const conversions = getYeastConversions(yeastAmount, yeastType);
    document.getElementById('yeastConversion').textContent =
        `Active Dry: ${conversions['active-dry'].toFixed(2)}g • Instant: ${conversions['instant'].toFixed(2)}g • Fresh: ${conversions['fresh'].toFixed(2)}g`;

    // Water temperature note
    let waterNote = 'Warmer water speeds fermentation; cooler water slows it. Ideal: 24-27°C (75-80°F).';
    if (waterTemp < 20) {
        waterNote = '❄️ Cool water: Slows yeast activity, longer fermentation needed.';
    } else if (waterTemp > 30) {
        waterNote = '🔥 Warm water: Speeds yeast activity, watch fermentation closely.';
    }
    document.getElementById('waterTempNote').textContent = waterNote;

    // Room temperature note
    let roomNote = 'Room temperature is critical. 24-26°C (75-78°F) is optimal.';
    if (roomTemp < 18) {
        roomNote = '❄️ Cold environment: Fermentation will be slow. Consider longer times or warmer spot.';
    } else if (roomTemp > 28) {
        roomNote = '🔥 Hot environment: Fermentation will be fast. Watch carefully to avoid overproofing.';
    }
    document.getElementById('roomTempNote').textContent = roomNote;

    // Autolyse suggestion
    document.getElementById('autolyseSuggestion').textContent = getAutolyseSuggestion(hydration, style);
}

function generateInstructions(hasAutolyse, mixingMethod, hydration, ballWeight, roomTemp, waterTemp) {
    const list = document.getElementById('instructionsList');
    list.innerHTML = '';

    const steps = [];
    let stepNum = 1;

    if (hasAutolyse) {
        steps.push({
            step: stepNum++,
            text: 'Mix flour and water together (skip salt and yeast). Let rest for 30-60 minutes at room temperature. This allows flour to fully hydrate and gluten to develop naturally.'
        });
    }

    if (mixingMethod === 'by-hand') {
        steps.push(
            {
                step: stepNum++,
                text: `In a large bowl, combine flour${hasAutolyse ? ' (already mixed with water)' : ' and water'}. Add salt, yeast, and oil. Mix with your hand until all flour is incorporated and you have a shaggy dough.`
            },
            {
                step: stepNum++,
                text: 'Knead by hand for 8-10 minutes using the "slap and fold" technique. Slap the dough against the counter, fold it back over itself, rotate, and repeat. Continue until the dough is smooth and elastic.'
            },
            {
                step: stepNum++,
                text: 'Windowpane Test: Stretch a small piece of dough between your fingers. It should stretch thin enough to see light through it without tearing. If it breaks, continue kneading for 2-3 more minutes.'
            }
        );
    } else if (mixingMethod === 'stand-mixer') {
        steps.push(
            {
                step: stepNum++,
                text: `Place flour${hasAutolyse ? ' (already mixed with water)' : ' and water'} in the mixer bowl. Add salt, yeast, and oil.`
            },
            {
                step: stepNum++,
                text: 'Using the dough hook attachment, mix on speed 2 for 2 minutes until dough is shaggy. Increase to speed 4-5 and mix for 6-8 minutes until dough becomes smooth and elastic.'
            },
            {
                step: stepNum++,
                text: 'Windowpane Test: Stop the mixer and test a small piece of dough. It should stretch thin without tearing. If needed, mix for another 2 minutes and retest.'
            }
        );
    } else if (mixingMethod === 'no-knead') {
        steps.push(
            {
                step: stepNum++,
                text: 'Mix flour, water, salt, yeast, and oil in a bowl until all flour is incorporated. No kneading needed. Cover and let rest at room temperature.'
            },
            {
                step: stepNum++,
                text: 'During bulk fermentation, perform 4-6 "stretch and folds" every 30 minutes for the first 2-3 hours. Wet your hand, grab one side of the dough, stretch it up and fold over the center. Repeat from all four sides.'
            },
            {
                step: stepNum++,
                text: 'The gluten develops through these folds and time rather than mechanical kneading. The dough should increase in volume and become stronger with each fold.'
            }
        );
    }

    steps.push(
        {
            step: stepNum++,
            text: `Bulk Fermentation: Cover the dough and let it ferment at room temperature (${roomTemp.toFixed(0)}°C / ${celsiusToFahrenheit(roomTemp).toFixed(0)}°F). The dough should increase by 50-75% in volume.`
        },
        {
            step: stepNum++,
            text: `Divide dough into ${document.getElementById('numBalls').value} equal pieces. Pre-shape each piece gently into a round. Rest for 10-15 minutes (bench rest).`
        },
        {
            step: stepNum++,
            text: 'Final shape: Stretch and fold each ball into a tight round. Place seam-side up in a floured banneton basket or seam-side down on a peel.'
        },
        {
            step: stepNum++,
            text: 'Final Proof: Let shaped doughs proof until they pass the "poke test." Gently prod the dough with a floured finger—it should spring back slowly but leave a slight indentation.'
        },
        {
            step: stepNum++,
            text: 'Bake at 250–300°C (480–570°F) depending on your oven and pizza style. Neapolitan: very hot, 60–90 seconds. Artisan: 12–15 minutes. Wood-fired ovens: 60–90 seconds.'
        }
    );

    steps.forEach((item) => {
        const li = document.createElement('li');
        li.setAttribute('data-step', item.step);
        li.textContent = item.text;
        list.appendChild(li);
    });
}

function generateFermentationSchedule(fermentTime, roomTemp, isColdFerm, coldFermDays, yeastAmount) {
    const schedule = document.getElementById('fermentationSchedule');
    schedule.innerHTML = '';

    const scheduleSteps = [];

    if (isColdFerm) {
        scheduleSteps.push(
            {
                time: 'Phase 1: Room Temperature (2–4 hours)',
                description: `Mix and bulk ferment at ${roomTemp.toFixed(0)}°C (${celsiusToFahrenheit(roomTemp).toFixed(0)}°F). Dough should rise 20–30%.`
            },
            {
                time: `Phase 2: Cold Fermentation (${coldFermDays} days)`,
                description: 'Shape and place in the refrigerator at 4°C (39°F). Dough develops complex flavor and is easier to score/stretch. Can be left 3–5 days total.'
            },
            {
                time: 'Final Proof & Bake',
                description: 'Remove from fridge 30–60 minutes before baking to let dough relax. Bake cold or at room temperature.'
            }
        );
    } else {
        const bulkTime = fermentTime * 0.6;
        const proofTime = fermentTime * 0.4;
        scheduleSteps.push(
            {
                time: `Bulk Fermentation: ${bulkTime.toFixed(1)} hours`,
                description: `At ${roomTemp.toFixed(0)}°C (${celsiusToFahrenheit(roomTemp).toFixed(0)}°F). Dough should increase 50–75% in volume. Perform stretch-and-folds or coil folds every 30 minutes if using the no-knead method.`
            },
            {
                time: `Shaping & Final Proof: ${proofTime.toFixed(1)} hours`,
                description: 'Shape into balls and proof until the poke test indicates readiness (slight spring-back with indentation). This typically takes 2–4 hours depending on room temperature.'
            }
        );
    }

    // Add temperature note if applicable
    if (roomTemp < 20) {
        scheduleSteps.push({
            time: '⏱️ Temperature Note',
            description: 'Your room is cooler than ideal. Fermentation will be slower—expect times to be 20–30% longer. Consider a warmer proofing spot (near a radiator, in an oven with light on, or in a cooler with warm water).'
        });
    } else if (roomTemp > 26) {
        scheduleSteps.push({
            time: '⏱️ Temperature Note',
            description: 'Your room is warmer than ideal. Fermentation will be faster—expect times to be 20–30% shorter. Watch the dough closely and use the poke test rather than timing alone to avoid overproofing.'
        });
    }

    // Create DOM elements
    scheduleSteps.forEach((step) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'fermentation-step';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'fermentation-step-time';
        timeSpan.textContent = step.time;

        const descParagraph = document.createElement('p');
        descParagraph.textContent = step.description;

        stepDiv.appendChild(timeSpan);
        stepDiv.appendChild(descParagraph);
        schedule.appendChild(stepDiv);
    });
}

// ============================================
// EVENT LISTENERS & INITIALIZATION
// ============================================

function setupEventListeners() {
    // Pizza style selection
    document.querySelectorAll('.style-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.style-btn').forEach((b) => b.classList.remove('active'));
            this.classList.add('active');
            loadStyleDefaults(this.dataset.style);
        });
    });

    // Slider & Input sync pairs (yeast is excluded - it's auto-calculated)
    // numBalls needs special handling to recalculate yeast
    const numBallsSlider = document.getElementById('numBallsSlider');
    const numBallsInput = document.getElementById('numBalls');
    if (numBallsSlider && numBallsInput) {
        numBallsSlider.addEventListener('input', () => {
            numBallsInput.value = numBallsSlider.value;
            renderRecipe();
        });
        numBallsInput.addEventListener('input', () => {
            let value = parseFloat(numBallsInput.value);
            value = Math.max(parseFloat(numBallsSlider.min), Math.min(parseFloat(numBallsSlider.max), value));
            numBallsSlider.value = value;
            numBallsInput.value = value;
            renderRecipe();
        });
    }

    syncSliderAndInput('ballWeightSlider', 'ballWeight');
    syncSliderAndInput('hydrationSlider', 'hydration');
    syncSliderAndInput('saltSlider', 'salt');
    syncSliderAndInput('oilSlider', 'oil');
    syncSliderAndInput('sugarSlider', 'sugar');
    syncSliderAndInput('waterTempSlider', 'waterTemp');
    syncSliderAndInput('roomTempSlider', 'roomTemp');
    syncSliderAndInput('fermentTimeSlider', 'fermentTime');
    syncSliderAndInput('coldFermDaysSlider', 'coldFermDaysInput');

    // Yeast slider and input sync (without renderRecipe - just sync values)
    const yeastSlider = document.getElementById('yeastSlider');
    const yeastInput = document.getElementById('yeastAmount');
    if (yeastSlider && yeastInput) {
        yeastSlider.addEventListener('input', () => {
            yeastInput.value = yeastSlider.value;
        });
        yeastInput.addEventListener('input', () => {
            let value = parseFloat(yeastInput.value);
            value = Math.max(parseFloat(yeastSlider.min), Math.min(parseFloat(yeastSlider.max), value));
            yeastSlider.value = value;
            yeastInput.value = value;
        });
    }

    // Temperature unit toggles
    document.getElementById('waterTempUnit').addEventListener('click', () => {
        toggleTempUnit('waterTempUnit', tempState.waterTempUnit);
    });

    document.getElementById('roomTempUnit').addEventListener('click', () => {
        toggleTempUnit('roomTempUnit', tempState.roomTempUnit);
    });

    // Cold fermentation toggle
    document.getElementById('coldFerm').addEventListener('change', function () {
        const coldFermDaysDiv = document.getElementById('coldFermDays');
        coldFermDaysDiv.style.display = this.checked ? 'block' : 'none';
        renderRecipe();
    });

    // Select & input changes
    document.getElementById('yeastType').addEventListener('change', renderRecipe);
    document.getElementById('mixingMethod').addEventListener('change', renderRecipe);
    document.getElementById('autolyseTgl').addEventListener('change', renderRecipe);

    // Initial render
    renderRecipe();
}

function loadStyleDefaults(styleName) {
    const defaults = STYLE_DEFAULTS[styleName];
    if (!defaults) return;

    document.getElementById('hydration').value = defaults.hydration;
    document.getElementById('hydrationSlider').value = defaults.hydration;

    document.getElementById('salt').value = defaults.salt;
    document.getElementById('saltSlider').value = defaults.salt;

    document.getElementById('oil').value = defaults.oil;
    document.getElementById('oilSlider').value = defaults.oil;

    document.getElementById('sugar').value = defaults.sugar;
    document.getElementById('sugarSlider').value = defaults.sugar;

    document.getElementById('ballWeight').value = defaults.ballWeight;
    document.getElementById('ballWeightSlider').value = defaults.ballWeight;

    document.getElementById('fermentTime').value = defaults.fermentTime;
    document.getElementById('fermentTimeSlider').value = defaults.fermentTime;

    document.getElementById('mixingMethod').value = defaults.mixingMethod;

    document.getElementById('autolyseTgl').checked = defaults.autolyse;

    // Set cold fermentation if specified in defaults
    if (defaults.coldFerm !== undefined) {
        document.getElementById('coldFerm').checked = defaults.coldFerm;
        const coldFermDaysDiv = document.getElementById('coldFermDays');
        coldFermDaysDiv.style.display = defaults.coldFerm ? 'block' : 'none';
        if (defaults.coldFermDays !== undefined) {
            document.getElementById('coldFermDaysInput').value = defaults.coldFermDays;
            document.getElementById('coldFermDaysSlider').value = defaults.coldFermDays;
        }
    }

    // Set yeast type BEFORE setting amount (so conversions work correctly)
    document.getElementById('yeastType').value = defaults.yeastType;

    document.getElementById('yeastAmount').value = defaults.yeastAmount;
    document.getElementById('yeastSlider').value = defaults.yeastAmount;

    document.getElementById('styleDescription').textContent = defaults.description;

    // Skip auto-calculation when loading defaults - use the style's default yeast amount
    renderRecipe(true);
}

// ============================================
// INITIALIZE ON DOM READY
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Set initial active style
    const neapolitanBtn = document.querySelector('[data-style="neapolitan"]');
    neapolitanBtn.classList.add('active');

    // Load Neapolitan defaults
    loadStyleDefaults('neapolitan');

    // Setup all event listeners
    setupEventListeners();
});
