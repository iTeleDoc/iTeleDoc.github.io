/**
 * Cortexa Medical Database: Fluid Resuscitation Computations
 */
window.FLUIDS_DB = [
    {
        id: "calc_parkland",
        category: "Fluid Resuscitation Engine",
        title: "Parkland Thermal Burn Calculation Engine",
        fields: [
            { id: "weight", label: "Patient Total Mass (kg)", type: "number", placeholder: "e.g., 70" },
            { id: "tbsa", label: "Total Burn Surface Area Percentage (% TBSA)", type: "number", placeholder: "e.g., 30" }
        ],
        execute: (inputs) => {
            const w = parseFloat(inputs.weight);
            const t = parseFloat(inputs.tbsa);
            if(isNaN(w) || isNaN(t) || t <= 0 || w <= 0) {
                return { value: "Error", interpretation: "Invalid numeric parameters", management: "Check input integrity strings.", status: "alert" };
            }
            const totalVolume = 4 * w * t; // mL in 24 hours
            const halfVolume = totalVolume / 2;
            const rateFirst8 = halfVolume / 8;
            const rateNext16 = halfVolume / 16;
            
            return {
                value: `${totalVolume.toLocaleString()} mL / 24 Hours`,
                interpretation: `Calculated total fluid requirements for the initial 24 hours following thermal injury using crystalloid vectors.`,
                management: `• <b>Initial Phase:</b> Infuse 50% (${halfVolume.toLocaleString()} mL) over the first 8 hours from timing of injury at a rate of <b>${rateFirst8.toFixed(1)} mL/hr</b>.<br>• <b>Maintenance Phase:</b> Administer remaining 50% over the subsequent 16 hours at a rate of <b>${rateNext16.toFixed(1)} mL/hr</b>. Target standard urine outputs.`
            };
        }
    }
];