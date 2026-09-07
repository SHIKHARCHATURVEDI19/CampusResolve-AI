import { OpenAI } from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Built-in lightweight semantic feature vector generator (deterministic word frequency/ngram vector space)
function generateLocalEmbedding(text: string, dim = 1536): number[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const vec = new Array(dim).fill(0);

  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash * 31 + word.charCodeAt(c)) >>> 0;
    }
    const idx = hash % dim;
    vec[idx] += 1.0;

    // Bigram for phrase preservation (e.g., "broken pipe", "wifi down")
    if (i < tokens.length - 1) {
      const bigram = word + '_' + tokens[i + 1];
      let bHash = 0;
      for (let c = 0; c < bigram.length; c++) {
        bHash = (bHash * 37 + bigram.charCodeAt(c)) >>> 0;
      }
      vec[bHash % dim] += 1.5;
    }
  }

  // Normalize vector to unit length
  let norm = 0;
  for (const v of vec) norm += v * v;
  if (norm > 0) {
    const sqrtNorm = Math.sqrt(norm);
    for (let i = 0; i < dim; i++) vec[i] /= sqrtNorm;
  }
  return vec;
}

export interface NLPClassification {
  department: 'MAINTENANCE' | 'IT' | 'HOUSEKEEPING' | 'SECURITY' | 'ACADEMICS';
  severity: number;
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (openai) {
    try {
      const resp = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return resp.data[0].embedding;
    } catch (err) {
      console.warn('OpenAI embedding call failed, falling back to local vectorizer:', (err as Error).message);
    }
  }
  return generateLocalEmbedding(text);
}

export async function classifyIssue(title: string, description: string): Promise<NLPClassification> {
  if (openai) {
    try {
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze the campus complaint. Return strictly JSON:
{"department": "MAINTENANCE"|"IT"|"HOUSEKEEPING"|"SECURITY"|"ACADEMICS", "severity": 1-5}`
          },
          {
            role: 'user',
            content: `Title: ${title}\nDescription: ${description}`
          }
        ],
        response_format: { type: 'json_object' }
      });
      const parsed = JSON.parse(resp.choices[0].message.content || '{}');
      return {
        department: parsed.department || 'MAINTENANCE',
        severity: Math.min(Math.max(Number(parsed.severity) || 3, 1), 5)
      };
    } catch (err) {
      console.warn('OpenAI classification call failed, falling back to heuristic classification:', (err as Error).message);
    }
  }

  // Heuristic rule engine fallback
  const content = `${title} ${description}`.toLowerCase();
  let department: NLPClassification['department'] = 'MAINTENANCE';
  let severity = 3;

  if (/hack|wifi|internet|router|server|login|portal|screen|projector|cable|software|computer|ethernet/i.test(content)) {
    department = 'IT';
    severity = /exam|submission|blackout|deadline/i.test(content) ? 4 : 3;
  } else if (/theft|fight|intruder|gate|lock|stolen|harass|dark|unattended|suspicious|cctv|weapon/i.test(content)) {
    department = 'SECURITY';
    severity = /emergency|weapon|fight|violence|night/i.test(content) ? 5 : 4;
  } else if (/trash|dustbin|dirty|clean|washroom|toilet|smell|garbage|pest|leak|cockroach|overflow/i.test(content)) {
    department = 'HOUSEKEEPING';
    severity = /overflow|health|foul/i.test(content) ? 4 : 2;
  } else if (/exam|professor|lecture|grading|attendance|course|syllabus|hall ticket/i.test(content)) {
    department = 'ACADEMICS';
    severity = 3;
  } else {
    department = 'MAINTENANCE';
    severity = /spark|wire|fire|flood|burst|shock/i.test(content) ? 5 : 3;
  }

  return { department, severity };
}
