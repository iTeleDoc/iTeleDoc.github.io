/**
 * Cortexa Medical Database: Resuscitation Protocols
 */
window.PROTOCOLS_DB = [
    {
        id: "prot_acls_arrest",
        category: "Resuscitation Life Support",
        title: "ACLS Cardiac Arrest Advanced Algorithm",
        content: `<b>Core Operational Framework:</b> Designed to manage pulseless cardiac arrest patterns, differentiating pathways into shockable vs non-shockable rhythms.<br><br>
                  <b>Shockable Pathway Sequences (VF/Pulseless VT):</b><br>
                  • Deliver immediate unsynchronized biphasic shock (200J).<br>
                  • Resume high-efficiency chest compressions immediately for 2 minutes without rhythmic pause evaluation loops.<br>
                  • During the second CPR cycle, obtain vascular access and push **Epinephrine 1mg IV/IO** every 3–5 minutes.<br>
                  • If VF remains refractory after a 3rd shock cycle, administer an **Amiodarone 300mg IV/IO** bolus vector.<br><br>
                  <b>Non-Shockable Pathway Sequences (PEA / Asystole):</b><br>
                  • Administer **Epinephrine 1mg IV/IO** as soon as access is secured.<br>
                  • Run continuous 2-minute high-quality CPR loops; investigate reversible triggers (H's and T's).`
    }
];