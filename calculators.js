/**
 * Cortexa Medical Database: Interactive Calculators Data Engine
 */
window.CALCULATORS_DB = [
    {
        id: "calc_apgar",
        category: "Neonatal Assessment",
        title: "APGAR Score Matrix Evaluator",
        fields: [
            { id: "hr", label: "Heart Rate (Pulse Entry)", type: "select", options: [{v:"0",l:"Absent (0)"},{v:"1",l:"Slow (<100 bpm) (1)"},{v:"2",l:">100 bpm (2)"}] },
            { id: "resp", label: "Respiratory Performance", type: "select", options: [{v:"0",l:"Absent (0)"},{v:"1",l:"Weak cry, hypoventilation (1)"},{v:"2",l:"Good, robust crying response (2)"}] },
            { id: "tone", label: "Muscle Tone (Activity Matrix)", type: "select", options: [{v:"0",l:"Flaccid (0)"},{v:"1",l:"Some flexion of extremities (1)"},{v:"2",l:"Active motion profile (2)"}] },
            { id: "reflex", label: "Reflex Irritability (Grimace)", type: "select", options: [{v:"0",l:"No response to stimulation (0)"},{v:"1",l:"Grimace / weak response (1)"},{v:"2",l:"Cry, sneeze, or vigorous pull-away (2)"}] },
            { id: "color", label: "Skin Coloration (Perfusion Axis)", type: "select", options: [{v:"0",l:"Cyanotic / pale across body (0)"},{v:"1",l:"Acrocyanosis (pink core, blue hands/feet) (1)"},{v:"2",l:"Completely pink infant (2)"}] }
        ],
        execute: (inputs) => {
            // Guard clause prevents layout calculations from breaking if selectors aren't initialized yet
            if (inputs.hr === undefined || inputs.resp === undefined || inputs.tone === undefined || inputs.reflex === undefined || inputs.color === undefined) {
                return { value: "Waiting", interpretation: "Select configuration vectors.", management: "Complete parameter fields above.", status: "normal" };
            }

            const sum = parseInt(inputs.hr) + parseInt(inputs.resp) + parseInt(inputs.tone) + parseInt(inputs.reflex) + parseInt(inputs.color);
            let status = "normal", inter = "", mgmt = "";
            
            if (sum >= 7) {
                status = "normal"; inter = "Vigorous and excellent systemic transition.";
                mgmt = "Routine post-delivery standard management care. Protect thermal environment via immediate skin-to-skin contact.";
            } else if (sum >= 4) {
                status = "warning"; inter = "Moderately depressed newborn profile.";
                mgmt = "Initiate immediate tactile stimulation, clear airway secretions, and administer targeted high-flow supplemental oxygen therapy.";
            } else {
                status = "alert"; inter = "Severely depressed physiological transition.";
                mgmt = "Activate neonatal resuscitation protocols immediately. Begin controlled bag-valve-mask positive pressure ventilation (PPV). Check continuous heart rates.";
            }
            return { value: `${sum} / 10`, interpretation: inter, management: mgmt, status };
        }
    }
];
