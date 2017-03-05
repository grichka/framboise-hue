
'use strict';

// Gamuts
var GAMUTS = {
    // LivingColors, Iris, Bloom, Aura, LightStrips
    A: [[0.704, 0.296], [0.2151, 0.7106], [0.138, 0.08]],
    // Hue A19 bulbs
    B: [[0.675, 0.322], [0.4091, 0.518], [0.167, 0.04]],
    // Hue BR30, A19 (Gen 3), Hue Go, LightStrips plus
    C: [[0.692, 0.308], [0.17, 0.7], [0.153, 0.048]]
};

/**
 * Returns the correct color gamut of a given philips hue model ID
 * @param {object} light
 */
var getGamut = function(light) {
    if(['LST001', 'LLC010', 'LLC011', 'LLC012', 'LLC006', 'LLC007', 'LLC013'].indexOf(light.modelId) > -1) {
        return GAMUTS.A;
    } else if(['LCT001', 'LCT007', 'LCT002', 'LCT003', 'LLM001'].indexOf(light.modelId > -1)) {
        return GAMUTS.B;
    } else if(['LCT010', 'LCT014', 'LCT011', 'LLC020', 'LST002'].indexOf(light.modelId) > -1) {
        return GAMUTS.C;
    } else {
        console.log('No modelId given for lights', light);
    }
};

/**
 * Check if a given point is in the given gamut. That is to say in the lamp color reach.
 * @param {Array} gamut 
 * @param {Array} xy
 * @returns {Boolean}
 */
var isPointInLampGamut = function(gamut, xy) {
    var v1 = [ gamut[1][0] - gamut[0][0], gamut[1][1] - gamut[0][1] ],
        v2 = [ gamut[2][0] - gamut[0][0], gamut[2][1] - gamut[0][1] ];

    var q = [ xy[0] - gamut[0][0], xy[1] - gamut[0][1] ],
        s = (q[0] * v2[1] - q[1] * v2[0]) / (v1[0] * v2[1] - v1[1] * v2[0]), // cross products x1 * y2 - x2 * y1
        t = (v1[0] * q[1] - v1[1] * q[0]) / (v1[0] * v2[1] - v1[1] * v2[0]);

    return (s >= 0.0) && (t >= 0.0) && (s + t <= 1.0);
};

/**
 * Get closest point to point p from the line defined by point A and point B
 * @param {Array} pointA 
 * @param {Array} pointB 
 * @param {Array} p 
 */
var getClosestPointToLine = function(pointA, pointB, p) {
    var AP = [ p[0] - pointA[0], p[1] - pointA[1] ],
        AB = [ pointB[0] - pointA[0], pointB[1] - pointA[1] ],
        t = ( AP[0] * AB[0] + AP[1] * AB[1] ) / ( AB[0]*AB[0] + AB[1]*AB[1] );
    if(t < 0) {
        t = 0;
    } else if(t > 1) {
        t = 1;
    }
    return [ pointA[0] + AB[0] * t, pointA[1] + AB[1] * t ];
};

/**
 * Calculate closest point from xy point that is in the given gamut
 * @param {Array} gamut 
 * @param {Array} xy
 * @returns {Array} closest xy point 
 */
var getClosestPoint = function(gamut, xy) {
    // find the closest point on each line in the CIE 1931 triangle
    var pAB = getClosestPointToLine(gamut[0], gamut[1], xy),
        pAC = getClosestPointToLine(gamut[2], gamut[0], xy),
        pBC = getClosestPointToLine(gamut[1], gamut[2], xy);

    // Get the distances per point and see which point is closer to xy
    var dAB = Math.sqrt(Math.pow(xy[0] - pAB[0], 2) + Math.pow(xy[1] - pAB[1], 2)),
        dAC = Math.sqrt(Math.pow(xy[0] - pAC[0], 2) + Math.pow(xy[1] - pAC[1], 2)),
        dBC = Math.sqrt(Math.pow(xy[0] - pBC[0], 2) + Math.pow(xy[1] - pBC[1], 2));
    
    var lowest = dAB,
        closestPoint = pAB;

    if(dAC < lowest) {
        lowest = dAC;
        closestPoint = pAC;
    }
    if(dBC < lowest) {
        lowest = dBC;
        closestPoint = pBC;
    }
    
    return closestPoint;
};

/**
 * Converts rgb color to XY point for a given light. XY point depends on the gamut of the light, and so on its model.
 * @param {object} light 
 * @param {Array} rgb
 * @returns {Array} XY point
 */
var rgbToXY = function(light, rgb) {
    // Get the RGB values from your color object and convert them to be between 0 and 1. 
    // So the RGB color (255, 0, 100) becomes (1.0, 0.0, 0.39)
    var red = rgb[0] / 255,
        green = rgb[1] / 255,
        blue = rgb[2] / 255;

    // Apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed 
    // on the screen of your device. This gamma correction is also applied to the screen of your computer or phone, 
    // thus we need this to create the same color on the light as on screen.
    var r = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92),
        g = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92),
        b = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);

    
    // Convert the RGB values to XYZ using the Wide RGB D65 conversion formula
    // var X = r * 0.649926 + g * 0.103455 + b * 0.197109, 
    //     Y = r * 0.234327 + g * 0.743075 + b * 0.022598,
    //     Z = r * 0.0000000 + g * 0.053077 + b * 1.035763;
    var X = r * 0.664511 + g * 0.154324 + b * 0.162028,
        Y = r * 0.283881 + g * 0.668433 + b * 0.047685,
        Z = r * 0.000088 + g * 0.072310 + b * 0.986039;

    // Calculate the xy values from the XYZ values
    var xy = [X / (X + Y + Z), Y / (X + Y + Z)];
    
    // Check if the found xy value is within the color gamut of the light, if not try to find a valid color and return it.
    var gamut = getGamut(light);
    if(!isPointInLampGamut(gamut, xy)) {
        return getClosestPoint(gamut, xy);
    } else {
        return xy;
    }
    // TODO ? Use the Y value of XYZ as brightness The Y value indicates the brightness of the converted color.
};

module.exports = {
    getGamut: getGamut,
    rgbToXY: rgbToXY
};