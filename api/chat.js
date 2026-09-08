// Vercel Serverless Function: /api/chat
// Handles Alem LLM queries with Farab Tour knowledge base and WhatsApp escalation link

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  const question = (body && body.question) ? body.question.trim() : '';
  if (!question) {
    return res.status(400).json({ status: 'error', message: 'Сұрақ бос болмауы керек' });
  }

  const apiKey = process.env.ALEM_API_KEY || 'sk-I8agzhli09Od5WbFynXkyA';
  const whatsappPhone = process.env.WHATSAPP_PHONE || '77474983298';

  const systemPrompt = `Сен Farab Tour (Мекке мен Мәдинаға рухани Ұмра сапарларын кәсіби деңгейде ұйымдастырушы туроператор) компаниясының ресми ақылды AI кеңесшісісің.

Компанияның негізгі мәліметтері:
- Негізін қалаушы әрі жетекші ұстаз: дінтанушы Әлфараби Сағымбекұлы (6+ жыл тәжірибе, 1200+ риза қажы, 35+ сәтті ұйымдастырылған топ).
- Ұшу қаласы: Шымкент халықаралық әуежайынан тікелей чартерлік/тұрақты рейстермен Мәдина немесе Жиддаға екі жаққа. Сондай-ақ Алматы мен Астанадан қосылу мүмкіндігі бар.
- Негізгі хит пакет: DOSTYK PACKAGE (11 күндік толық сапар — Мәдина қаласында 4 күн мешіт жанында, Мекке қаласында 7 күн әл-Харамға жақын 5★ қонақүй).
- Топтамаға кіретін 9 негізгі қызмет:
  1. Әуе билеті (Шымкент - Мәдина / Жидда - Шымкент екі жаққа)
  2. Ресми Ұмра Визасы мен толық медициналық сақтандыру
  3. 5★ Премиум Қонақүйлер (Мекке мен Мәдинада мешіт жанындағы жайлы бөлмелер)
  4. VIP Трансфер (жайлы, салқындатқышы бар люкс автобустармен қатынау)
  5. Ұстаз жетекшілігі (Әлфараби ұстазбен амалдар, дұғалар, күнделікті уағыздар)
  6. Тарихи Зиярат (Ұхыд тауы, Құба мешіті, Қос құбыла, Нұр тауы, Сауыр үңгірі)
  7. Толық Тамақтану (3-4 мезгіл швед үстелі және халал асхана)
  8. 2x23 кг Багаж + 7 кг қол жүгі + 5 литр Зәмзәм сыйы
  9. Қажылар жинағы (ихрам, сөмке, бейдж, жолбасшы кітапша)
- Құжаттар: Жарамдылық мерзімі кемінде 6 ай қалған шетелдік төлқұжат және 3x4 көлеміндегі фотосурет (визаны толық агенттік рәсімдейді).
- Дайындық: Сапар алдында қажыларға 3 апталық тегін рухани және практикалық дәрістер өткізіледі.
- Ерекшелігі: Әр қажыға жеке жанашырлық пен қамқорлық, жан тыныштығы.

Жауап беру ережелерің:
1. Тек қазақ тілінде, өте сыпайы, жылы, сенімді әрі сауатты жауап бер.
2. Мәліметті жинақы, қысқа әрі түсінікті жеткіз.
3. МАНЫЗДЫ ТАЛАП: Жауабыңда ЕШҚАШАН решетка (#, ##, ###) таңбаларын қолданба! Тақырыптарды жай ғана нөмірлеп немесе қалың әріппен жаз.
4. Егер қолданушы нақты бағаларды, жақын күндерді немесе орын брондауды сұраса, сұрағына қысқа мәлімет беріп: «Толық кеңес алу немесе орын брондау үшін төмендегі WhatsApp батырмасы арқылы менеджерімізбен байланысыңыз» деп бағытта.`;

  try {
    const response = await fetch('https://llm.alem.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'alemllm',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ]
      })
    });

    const data = await response.json();
    let answer =
      data?.choices?.[0]?.message?.content ||
      'Кешіріңіз, қазір жауап дайындау мүмкін болмады. Төмендегі WhatsApp батырмасы арқылы менеджерімізбен байланысуыңызды сұраймыз.';

    // Strip any lingering hash marks from response
    answer = answer.replace(/^#{1,6}\s*/gm, '');

    const defaultWaText = `Ассалаумағалейкум! Farab Tour сайтындағы AI кеңесшіден мына сұрақты қойған едім:\n\n«${question}»\n\nОсы бойынша толық мәлімет беріп, орын брондауға көмектесесіз бе?`;
    const waUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(defaultWaText)}`;

    return res.status(200).json({
      status: 'success',
      answer: answer,
      whatsapp_url: waUrl
    });
  } catch (err) {
    console.error('Alem LLM Error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Alem AI серверіне байланыс орнату кезінде қате орын алды.'
    });
  }
}
