// i18n.js - Internationalization module for EV Battery Health Report
// Supports EN and DE. Works in both browser and Node.js environments.

const translations = {
  en: {
    // General
    title: 'EV Battery Health Report',
    subtitle: 'Analyze your electric vehicle battery data',
    privacyNote: 'All data is processed locally in your browser. Nothing is uploaded to any server.',

    // Upload
    dropPrompt: 'Drop your CSV file here',
    browseFiles: 'Browse Files',
    orText: 'or',
    exportedFrom: 'Exported from Car Scanner ELM OBD2',

    // Car Info Form
    fileLoaded: 'File loaded',
    foundCells: 'Found {count} battery cells',
    carMake: 'Car Make',
    carModel: 'Car Model',
    mileage: 'Mileage',
    dateOfReading: 'Date of Reading',
    knownSoh: 'Known SoH (%)',
    batteryCapacity: 'Battery Capacity (kWh)',
    generateReport: 'Generate Report',
    other: 'Other',

    // Report Tab
    reportTab: 'Report',
    detailsTab: 'Details',
    basedOn: 'Based on {count} data points',
    date: 'Date',
    reportId: 'Report ID',
    make: 'Make',
    model: 'Model',
    battery: 'Battery',
    cellBalanceScore: 'Cell Balance Score',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    delta: 'Delta',
    acrossCells: 'across {count} cells',
    energy: 'Energy',
    currentContent: 'Current content',
    maxContent: 'Maximum content',
    ratio: 'Ratio',
    packVoltage: 'Pack Voltage',
    userProvided: 'User provided',
    quickChecks: 'Quick Checks',
    checkCellSpread: 'Cell voltage spread is within tolerance',
    checkTempSpread: 'Temperature spread is within tolerance',
    checkCellsInRange: 'All cells are within expected voltage range',
    checkVoltageConsistent: 'Pack voltage is consistent with cell sum',
    checkNoOutliers: 'No outlier cells detected',
    checkSocAvailable: 'State of charge data available',
    cellVoltagesOverview: 'Cell Voltages Overview',
    cells: 'Cells',
    min: 'Min',
    max: 'Max',
    avg: 'Average',
    assessment: 'Assessment',
    excellentCondition: 'Battery is in excellent condition. Cell balance is very good.',
    goodCondition: 'Battery is in good condition. Minor imbalance detected.',
    attentionRecommended: 'Attention recommended. Battery shows signs of imbalance or degradation.',
    disclaimer: 'This report is for informational purposes only and does not constitute professional advice. Results may vary based on data quality and completeness.',

    // Details Tab
    cellVoltages: 'Cell Voltages',
    colorCodedByDeviation: 'Color coded by deviation from average',
    low: 'Low',
    high: 'High',
    cell: 'Cell',
    batteryTemperature: 'Battery Temperature',
    sensors: 'sensors',
    bmsData: 'BMS Data',
    socDisplay: 'SoC (Display)',
    socBms: 'SoC (BMS)',
    cellSumVoltage: 'Cell Sum Voltage',
    batteryCurrent: 'Battery Current',
    batteryPower: 'Battery Power',
    chargeVoltageLimit: 'Charge Voltage Limit',
    maxChargeCurrent: 'Max Charge Current',
    energyAndRange: 'Energy & Range',
    currentEnergy: 'Current Energy',
    maxEnergy: 'Max Energy',
    energyRatio: 'Energy Ratio',
    estimatedRange: 'Estimated Range',
    odometer: 'Odometer',
    avgConsumption: 'Avg. Consumption',
    auxBattery: 'Auxiliary Battery',
    voltage: 'Voltage',
    soc: 'SoC',
    temperature: 'Temperature',
    capacityAging: 'Capacity Aging',
    allParameters: 'All Parameters',
    groupedByModule: 'Grouped by Module',
    expand: 'Expand',
    collapse: 'Collapse',
    lastValue: 'Last Value',
    unit: 'Unit',

    // Export
    printPdf: 'Print / Save as PDF',
    shareLink: 'Share Link',
    newUpload: 'New Upload',
    linkCopied: 'Link copied to clipboard!',

    // Errors
    invalidFile: 'Invalid file. Please upload a CSV file exported from Car Scanner ELM OBD2.',
    parseError: 'Error parsing file: {message}',
    noBatteryData: 'No battery data found in the uploaded file.',
  },

  de: {
    // General
    title: 'EV Batteriezustandsbericht',
    subtitle: 'Analysieren Sie die Batteriedaten Ihres Elektrofahrzeugs',
    privacyNote: 'Alle Daten werden lokal in Ihrem Browser verarbeitet. Es werden keine Daten auf einen Server hochgeladen.',

    // Upload
    dropPrompt: 'CSV-Datei hier ablegen',
    browseFiles: 'Dateien durchsuchen',
    orText: 'oder',
    exportedFrom: 'Exportiert aus Car Scanner ELM OBD2',

    // Car Info Form
    fileLoaded: 'Datei geladen',
    foundCells: '{count} Batteriezellen gefunden',
    carMake: 'Fahrzeughersteller',
    carModel: 'Fahrzeugmodell',
    mileage: 'Kilometerstand',
    dateOfReading: 'Datum der Messung',
    knownSoh: 'Bekannter SoH (%)',
    batteryCapacity: 'Batteriekapazität (kWh)',
    generateReport: 'Bericht erstellen',
    other: 'Andere',

    // Report Tab
    reportTab: 'Bericht',
    detailsTab: 'Details',
    basedOn: 'Basierend auf {count} Datenpunkten',
    date: 'Datum',
    reportId: 'Berichts-ID',
    make: 'Hersteller',
    model: 'Modell',
    battery: 'Batterie',
    cellBalanceScore: 'Zellbalance-Bewertung',
    excellent: 'Ausgezeichnet',
    good: 'Gut',
    fair: 'Akzeptabel',
    poor: 'Schlecht',
    delta: 'Delta',
    acrossCells: 'über {count} Zellen',
    energy: 'Energie',
    currentContent: 'Aktueller Inhalt',
    maxContent: 'Maximaler Inhalt',
    ratio: 'Verhältnis',
    packVoltage: 'Paketspannung',
    userProvided: 'Vom Benutzer angegeben',
    quickChecks: 'Schnellprüfungen',
    checkCellSpread: 'Zellspannungsspreizung liegt innerhalb der Toleranz',
    checkTempSpread: 'Temperaturspreizung liegt innerhalb der Toleranz',
    checkCellsInRange: 'Alle Zellen liegen im erwarteten Spannungsbereich',
    checkVoltageConsistent: 'Paketspannung stimmt mit Zellsumme überein',
    checkNoOutliers: 'Keine Ausreißerzellen erkannt',
    checkSocAvailable: 'Ladezustandsdaten verfügbar',
    cellVoltagesOverview: 'Zellspannungsübersicht',
    cells: 'Zellen',
    min: 'Min',
    max: 'Max',
    avg: 'Durchschnitt',
    assessment: 'Bewertung',
    excellentCondition: 'Batterie ist in ausgezeichnetem Zustand. Zellbalance ist sehr gut.',
    goodCondition: 'Batterie ist in gutem Zustand. Leichte Ungleichgewicht erkannt.',
    attentionRecommended: 'Aufmerksamkeit empfohlen. Batterie zeigt Anzeichen von Ungleichgewicht oder Degradation.',
    disclaimer: 'Dieser Bericht dient nur zu Informationszwecken und stellt keine professionelle Beratung dar. Ergebnisse können je nach Datenqualität und -vollständigkeit variieren.',

    // Details Tab
    cellVoltages: 'Zellspannungen',
    colorCodedByDeviation: 'Farbcodiert nach Abweichung vom Durchschnitt',
    low: 'Niedrig',
    high: 'Hoch',
    cell: 'Zelle',
    batteryTemperature: 'Batterietemperatur',
    sensors: 'Sensoren',
    bmsData: 'BMS-Daten',
    socDisplay: 'SoC (Anzeige)',
    socBms: 'SoC (BMS)',
    cellSumVoltage: 'Zellsummenspannung',
    batteryCurrent: 'Batteriestrom',
    batteryPower: 'Batterieleistung',
    chargeVoltageLimit: 'Ladespannungsgrenze',
    maxChargeCurrent: 'Maximaler Ladestrom',
    energyAndRange: 'Energie & Reichweite',
    currentEnergy: 'Aktuelle Energie',
    maxEnergy: 'Maximale Energie',
    energyRatio: 'Energieverhältnis',
    estimatedRange: 'Geschätzte Reichweite',
    odometer: 'Kilometerstand',
    avgConsumption: 'Durchschnittsverbrauch',
    auxBattery: 'Hilfsbatterie',
    voltage: 'Spannung',
    soc: 'SoC',
    temperature: 'Temperatur',
    capacityAging: 'Kapazitätsalterung',
    allParameters: 'Alle Parameter',
    groupedByModule: 'Nach Modul gruppiert',
    expand: 'Erweitern',
    collapse: 'Einklappen',
    lastValue: 'Letzter Wert',
    unit: 'Einheit',

    // Export
    printPdf: 'Drucken / Als PDF speichern',
    shareLink: 'Link teilen',
    newUpload: 'Neuer Upload',
    linkCopied: 'Link in die Zwischenablage kopiert!',

    // Errors
    invalidFile: 'Ungültige Datei. Bitte laden Sie eine CSV-Datei hoch, die aus Car Scanner ELM OBD2 exportiert wurde.',
    parseError: 'Fehler beim Verarbeiten der Datei: {message}',
    noBatteryData: 'Keine Batteriedaten in der hochgeladenen Datei gefunden.',
  },
};

// Guard localStorage access for Node.js compatibility
let currentLang = (typeof localStorage !== 'undefined' && localStorage.getItem('ev-report-lang')) || 'en';

/**
 * Translate a key, optionally replacing {placeholder} tokens.
 * @param {string} key - Translation key
 * @param {Object} [replacements] - Map of placeholder names to values
 * @returns {string}
 */
export function t(key, replacements) {
  const lang = translations[currentLang] || translations['en'];
  let text = lang[key] ?? translations['en'][key] ?? key;

  if (replacements) {
    for (const [placeholder, value] of Object.entries(replacements)) {
      text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
    }
  }

  return text;
}

/**
 * Set the active language and persist it.
 * @param {string} lang - Language code ('en' or 'de')
 */
export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    if (typeof localStorage !== 'undefined') localStorage.setItem('ev-report-lang', lang);
  }
}

/**
 * Get the currently active language code.
 * @returns {string}
 */
export function getLanguage() {
  return currentLang;
}
