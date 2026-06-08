/**
 * Cortexa Medical Database: Advanced Laboratory Interpretation Matrix
 */
window.LABS_DB = [
    {
        id: "calc_hellp",
        category: "Obstetric Diagnostic Panels",
        title: "Preeclampsia & HELLP Laboratory Screen",
        fields: [
            { id: "plt", label: "Platelet Count (x10³/µL)", type: "number", placeholder: "e.g., 120" },
            { id: "ast", label: "Aspartate Aminotransferase (AST) (U/L)", type: "number", placeholder: "e.g., 35" }
        ],
        execute: (inputs) => {
            const plt = parseFloat(inputs.plt);
            const ast = parseFloat(inputs.ast);
            if(isNaN(plt) || isNaN(ast)) {
                return { value: "Error", interpretation: "Missing numeric components.", management: "Re-enter valid data metrics.", status: "alert" };
            }
            
            let alertLevel = "normal";
            let inter = "Labs reflect baseline normal pregnancy parameters.";
            let mgmt = "Continue standard antenatal monitoring tracking updates.";
            
            if (plt < 100 || ast > 70) {
                alertLevel = "alert";
                inter = "CRITICAL METRIC MATCH: Highly indicative of HELLP Syndrome or Severe Preeclampsia structural breakdown.";
                mgmt = "Initiate immediate intravenous <b>Magnesium Sulfate</b> prophylactic infusions to prevent seizure activity. Arrange emergent maternal-fetal specialty evaluation for continuous delivery deployment pathways.";
            } else if (plt < 150 || ast > 40) {
                alertLevel = "warning";
                inter = "Borderline lab values. Early signs of microangiopathic hemolytic and hepatic stress tracking vectors.";
                mgmt = "Repeat complete laboratory indices within 4-6 hours. Monitor clinical evolution signs closely (headache, right-upper quadrant abdominal distress).";
            }
            
            return { value: `Plt: ${plt}k | AST: ${ast} U/L`, interpretation: inter, management: mgmt, status: alertLevel };
        }
    }
];