import { describe, it, expect } from 'vitest';

// Replica de la lógica de detección de palabras clave SPIN de la página de análisis
const situationKeywords = ['actualmente', 'ahora mismo', 'que proveedor', 'cuanto', 'cuantos', 'desde cuando', 'como es', 'que tipo'];
const problemKeywords = ['problema', 'preocupa', 'dificultad', 'frustrar', 'molesta', 'insatisf', 'falla', 'queja'];
const implicationKeywords = ['impacto', 'consecuencia', 'afecta', 'significa', 'si eso sigue', 'costar', 'perder', 'riesgo'];
const needPayoffKeywords = ['si pudiera', 'que significaria', 'como mejoraria', 'que valor', 'imagina', 'beneficio', 'solucion'];

function countByType(messages: string[], keywords: string[]): number {
  return messages.filter(text => keywords.some(k => text.toLowerCase().includes(k))).length;
}

describe('Contador de preguntas SPIN', () => {
  it('detecta preguntas de situación', () => {
    const msgs = ['Que proveedor tienen actualmente?', 'Cuanto pagan al mes?'];
    expect(countByType(msgs, situationKeywords)).toBe(2);
  });

  it('detecta preguntas de problema', () => {
    const msgs = ['Que es lo que mas os preocupa de la factura?', 'Habeis tenido algun problema con el servicio?'];
    expect(countByType(msgs, problemKeywords)).toBe(2);
  });

  it('detecta preguntas de implicación', () => {
    const msgs = ['Como afecta eso a vuestro presupuesto?', 'Si eso sigue asi, cuanto os va a costar?'];
    expect(countByType(msgs, implicationKeywords)).toBe(2);
  });

  it('detecta preguntas de necesidad-beneficio', () => {
    const msgs = ['Si pudierais reducir ese coste, que significaria para vosotros?', 'Que valor tendria una solucion asi?'];
    expect(countByType(msgs, needPayoffKeywords)).toBe(2);
  });

  it('devuelve 0 para mensajes no relacionados', () => {
    const msgs = ['Buenos dias', 'Encantado de conocerle'];
    expect(countByType(msgs, situationKeywords)).toBe(0);
    expect(countByType(msgs, problemKeywords)).toBe(0);
  });

  it('maneja mensajes vacíos', () => {
    expect(countByType([], situationKeywords)).toBe(0);
  });

  it('no distingue entre mayúsculas y minúsculas', () => {
    const msgs = ['QUE PROVEEDOR TIENEN ACTUALMENTE?'];
    expect(countByType(msgs, situationKeywords)).toBe(1);
  });
});
