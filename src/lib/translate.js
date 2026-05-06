// FieldSnap bilingual text helpers.
// This app can run locally without a paid translation API, so we use:
// 1) a local construction-friendly fallback translator for common phrases
// 2) LibreTranslate when available
// 3) never leave the opposite-language field blank

const ES_WORDS = /\b(el|la|los|las|un|una|que|de|en|es|por|con|del|al|se|su|hay|para|como|esto|esta|este|pero|más|muy|así|si|no|sí|yo|tú|él|ella|arreglar|necesitamos|foto|captura|pantalla|tarea|comentario|favor|llama|llame|dime|avisa|avisame|nombre|número|teléfono|tiene|malo|revestimiento|podemos|editar|añadir|algunas|flores|signed|firmó|quitar|cinta|casa|limpiar|espejo|pared|techo|piso|baño|cocina|cuarto|puerta|ventana|pintar|reparar|necesita|necesito|hola|gracias|buenos|buenas|días|tardes|noches|qué|cómo|cuándo|dónde|quién|cuál)\b/i

export function detectLanguage(text = '') {
  const clean = String(text || '').trim()
  if (!clean) return 'en'
  const words = clean.split(/\s+/)
  const esMatches = words.filter(w => ES_WORDS.test(w)).length
  return esMatches >= 2 || (words.length <= 4 && ES_WORDS.test(clean)) ? 'es' : 'en'
}

const exactEnToEs = new Map(Object.entries({
  'we need to fix this screenshot': 'necesitamos arreglar esta captura de pantalla',
  'did this get fixed?': '¿Se arregló esto?',
  'fix this screenshot': 'arreglar esta captura de pantalla',
  'this needs to be fixed': 'esto necesita ser arreglado',
  'take a picture': 'toma una foto',
  'take photo': 'tomar foto',
  'upload photo': 'subir foto',
  'replace photo': 'reemplazar foto',
  'paint the room': 'pintar el cuarto',
  'clean the room': 'limpiar el cuarto',
  'repair the wall': 'reparar la pared',
  'fix the door': 'arreglar la puerta',
  'install the light': 'instalar la luz',
  'check this': 'revisa esto',
  'please fix this': 'por favor arregla esto',
  'needs repair': 'necesita reparación',
  'done': 'hecho',
  'completed': 'completado',
  'what do we do now?': '¿Qué hacemos ahora?',
  'what do we do now': '¿Qué hacemos ahora?',
  'good morning': 'buenos días',
  'good afternoon': 'buenas tardes',
  'good evening': 'buenas noches',
  'hello': 'hola',
  'hi': 'hola',
  'test': 'prueba',
  'we need to fix this': 'necesitamos arreglar esto',
  'did this get fixed': '¿Se arregló esto?'
}))

const exactEsToEn = new Map(Array.from(exactEnToEs.entries()).map(([en, es]) => [es.toLowerCase(), en]))

const wordEnToEs = [
  [/\bscreenshot\b/gi, 'captura de pantalla'],
  [/\bphoto\b/gi, 'foto'],
  [/\bpicture\b/gi, 'foto'],
  [/\bimage\b/gi, 'imagen'],
  [/\bfix\b/gi, 'arreglar'],
  [/\bfixed\b/gi, 'arreglado'],
  [/\brepair\b/gi, 'reparar'],
  [/\breplace\b/gi, 'reemplazar'],
  [/\binstall\b/gi, 'instalar'],
  [/\bclean\b/gi, 'limpiar'],
  [/\bpaint\b/gi, 'pintar'],
  [/\bwall\b/gi, 'pared'],
  [/\bdoor\b/gi, 'puerta'],
  [/\bwindow\b/gi, 'ventana'],
  [/\bfloor\b/gi, 'piso'],
  [/\bceiling\b/gi, 'techo'],
  [/\bbathroom\b/gi, 'baño'],
  [/\bkitchen\b/gi, 'cocina'],
  [/\broom\b/gi, 'cuarto'],
  [/\bneed to\b/gi, 'necesitamos'],
  [/\bneeds to\b/gi, 'necesita'],
  [/\bwe need to\b/gi, 'necesitamos'],
  [/\bthis\b/gi, 'esto'],
  [/\bthe\b/gi, 'el'],
  [/\ba\b/gi, 'un'],
  [/\bis\b/gi, 'es'],
  [/\bare\b/gi, 'son'],
  [/\band\b/gi, 'y'],
  [/\bwith\b/gi, 'con'],
  [/\bbefore\b/gi, 'antes'],
  [/\bafter\b/gi, 'después'],
  [/\btoday\b/gi, 'hoy'],
  [/\btomorrow\b/gi, 'mañana']
]

const wordEsToEn = [
  [/\bcaptura de pantalla\b/gi, 'screenshot'],
  [/\bfoto\b/gi, 'photo'],
  [/\bimagen\b/gi, 'image'],
  [/\barreglar\b/gi, 'fix'],
  [/\barreglado\b/gi, 'fixed'],
  [/\breparar\b/gi, 'repair'],
  [/\breemplazar\b/gi, 'replace'],
  [/\binstalar\b/gi, 'install'],
  [/\blimpiar\b/gi, 'clean'],
  [/\bpintar\b/gi, 'paint'],
  [/\bpared\b/gi, 'wall'],
  [/\bpuerta\b/gi, 'door'],
  [/\bventana\b/gi, 'window'],
  [/\bpiso\b/gi, 'floor'],
  [/\btecho\b/gi, 'ceiling'],
  [/\bbaño\b/gi, 'bathroom'],
  [/\bcocina\b/gi, 'kitchen'],
  [/\bcuarto\b/gi, 'room'],
  [/\bnecesitamos\b/gi, 'we need to'],
  [/\bnecesita\b/gi, 'needs to'],
  [/\besto\b/gi, 'this'],
  [/\bel\b/gi, 'the'],
  [/\bla\b/gi, 'the'],
  [/\bun\b/gi, 'a'],
  [/\bes\b/gi, 'is'],
  [/\bson\b/gi, 'are'],
  [/\by\b/gi, 'and'],
  [/\bcon\b/gi, 'with'],
  [/\bantes\b/gi, 'before'],
  [/\bdespués\b/gi, 'after'],
  [/\bhoy\b/gi, 'today'],
  [/\bmañana\b/gi, 'tomorrow']
]

function normalize(s) {
  return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase().replace(/[.!]+$/g, '')
}

export function localTranslate(text, fromLang, toLang) {
  const original = String(text || '').trim()
  if (!original || fromLang === toLang) return original
  const key = normalize(original)
  if (fromLang === 'en' && toLang === 'es') {
    if (exactEnToEs.has(key)) return exactEnToEs.get(key)
    let out = original
    for (const [re, repl] of wordEnToEs) out = out.replace(re, repl)
    return out === original ? original : out
  }
  if (fromLang === 'es' && toLang === 'en') {
    if (exactEsToEn.has(key)) return exactEsToEn.get(key)
    let out = original
    for (const [re, repl] of wordEsToEn) out = out.replace(re, repl)
    return out === original ? original : out
  }
  return original
}

export async function translateText(text, fromLang, toLang) {
  if (!text || fromLang === toLang) return text

  // Try MyMemory free translation API (1000 free requests/day)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const langPair = `${fromLang}-${fromLang === 'en' ? 'GB' : 'ES'}|${toLang}-${toLang === 'en' ? 'GB' : 'ES'}`
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}&de=noreply@nextlevelprops.com`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    if (res.ok) {
      const data = await res.json()
      const translated = String(data.responseData?.translatedText || '').trim()
      if (translated && translated.toLowerCase() !== text.toLowerCase() && !translated.includes('MYMEMORY')) return translated
    }
  } catch {
    // fall through to local
  }

  return localTranslate(text, fromLang, toLang) || text
}

export async function getBilingualText(text) {
  const clean = String(text || '').trim()
  const detected = detectLanguage(clean)
  if (detected === 'es') {
    const en = await translateText(clean, 'es', 'en')
    const enFinal = (en && en.toLowerCase() !== clean.toLowerCase()) ? en : localTranslate(clean, 'es', 'en') || clean
    return { en: enFinal, es: clean }
  }
  const es = await translateText(clean, 'en', 'es')
  const esFinal = (es && es.toLowerCase() !== clean.toLowerCase()) ? es : localTranslate(clean, 'en', 'es') || clean
  return { en: clean, es: esFinal }
}

export function displayTextForLang(en, es, lang) {
  const enText = String(en || '').trim()
  const esText = String(es || '').trim()
  if (lang === 'es') {
    if (esText && esText !== enText) return esText
    return localTranslate(enText, 'en', 'es') || enText
  }
  if (enText && enText !== esText) return enText
  return localTranslate(esText, 'es', 'en') || esText
}


// Returns both the main text and opposite-language text for display.
// This also fixes older rows where the translated database column was blank
// or accidentally saved the same text twice.
export function getTextPairForLang(en, es, lang) {
  const enText = String(en || '').trim()
  const esText = String(es || '').trim()

  let fixedEn = enText
  let fixedEs = esText

  if (!fixedEs && fixedEn) fixedEs = localTranslate(fixedEn, 'en', 'es') || fixedEn
  if (!fixedEn && fixedEs) fixedEn = localTranslate(fixedEs, 'es', 'en') || fixedEs

  if (fixedEn && fixedEs && fixedEn.toLowerCase() === fixedEs.toLowerCase()) {
    if (detectLanguage(fixedEn) === 'es') fixedEn = localTranslate(fixedEs, 'es', 'en') || fixedEn
    else fixedEs = localTranslate(fixedEn, 'en', 'es') || fixedEs
  }

  const primary = lang === 'es' ? (fixedEs || fixedEn) : (fixedEn || fixedEs)
  const secondary = lang === 'es' ? fixedEn : fixedEs
  return { primary, secondary }
}
