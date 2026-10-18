import { ObjectCard, Category } from '../types';
import { TARGET_WIDTH, TARGET_HEIGHT } from './db';

// Generate a clean stylized 2:3 canvas image blob for starter cards
function createStyledCardImage(
  title: string,
  primaryColor: string,
  accentColor: string,
  symbol: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  grad.addColorStop(0, primaryColor);
  grad.addColorStop(1, accentColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  // Decorative organic curves
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.arc(TARGET_WIDTH * 0.75, TARGET_HEIGHT * 0.25, 400, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(TARGET_WIDTH * 0.2, TARGET_HEIGHT * 0.8, 350, 0, Math.PI * 2);
  ctx.fill();

  // Subtle grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 3;
  for (let x = 0; x < TARGET_WIDTH; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TARGET_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < TARGET_HEIGHT; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TARGET_WIDTH, y);
    ctx.stroke();
  }

  // Central Card Frame
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.roundRect(140, 320, TARGET_WIDTH - 280, 880, 48);
  ctx.fill();

  // Shadow
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw Symbol Emoji / Icon in center
  ctx.font = '220px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, TARGET_WIDTH / 2, 650);

  // Label text
  ctx.fillStyle = '#1c1917';
  ctx.font = 'bold 64px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(title, TARGET_WIDTH / 2, 940);

  ctx.fillStyle = '#57534e';
  ctx.font = '500 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Object English · 2:3 Flashcard', TARGET_WIDTH / 2, 1020);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create sample card image'));
      },
      'image/jpeg',
      0.92
    );
  });
}

export async function getStarterPackData(): Promise<{ cards: ObjectCard[]; categories: Category[] }> {
  const [wateringCanImg, mugImg, lampImg] = await Promise.all([
    createStyledCardImage('Watering Can', '#064e3b', '#047857', '🪴'),
    createStyledCardImage('Coffee Mug', '#78350f', '#b45309', '☕'),
    createStyledCardImage('Desk Lamp', '#1e1b4b', '#4338ca', '💡')
  ]);

  const cards: ObjectCard[] = [
    {
      id: crypto.randomUUID(),
      english: 'watering can',
      indonesian: 'penyiram tanaman',
      pronunciation: 'wotering ken',
      category: 'Garden',
      image: wateringCanImg,
      createdAt: Date.now() - 86400000 * 2,
      exampleSentence: 'She filled the watering can with fresh water. (Dia mengisi penyiram tanaman dengan air segar.)',
      repetition: 0,
      easiness: 2.5,
      interval: 0,
      words: [
        {
          english: 'spout',
          indonesian: 'corong penyiram',
          pronunciation: 'spaut',
          exampleSentence: 'Water pours gently from the long spout.',
          x: 28,
          y: 42
        },
        {
          english: 'handle',
          indonesian: 'gagang / pegangan',
          pronunciation: 'hendel',
          exampleSentence: 'Grip the sturdy handle firmly.',
          x: 74,
          y: 48
        },
        {
          english: 'rose',
          indonesian: 'kepala penyemprot',
          pronunciation: 'rouz',
          exampleSentence: 'The rose head disperses the water droplets.',
          x: 22,
          y: 35
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      english: 'coffee mug',
      indonesian: 'cangkir kopi',
      pronunciation: 'kofi mag',
      category: 'Kitchen',
      image: mugImg,
      createdAt: Date.now() - 86400000,
      exampleSentence: 'A warm coffee mug sat on the wooden table. (Cangkir kopi hangat ada di atas meja kayu.)',
      repetition: 0,
      easiness: 2.5,
      interval: 0,
      words: [
        {
          english: 'handle',
          indonesian: 'pegangan cangkir',
          pronunciation: 'hendel',
          exampleSentence: 'Hold the mug by its loop handle.',
          x: 75,
          y: 52
        },
        {
          english: 'rim',
          indonesian: 'bibir cangkir',
          pronunciation: 'rim',
          exampleSentence: 'Sip carefully from the top rim.',
          x: 50,
          y: 36
        },
        {
          english: 'saucer',
          indonesian: 'piring tatakan',
          pronunciation: 'soser',
          exampleSentence: 'Place the mug on the ceramic saucer.',
          x: 50,
          y: 75
        }
      ]
    },
    {
      id: crypto.randomUUID(),
      english: 'desk lamp',
      indonesian: 'lampu meja',
      pronunciation: 'desk lemp',
      category: 'Work & Study',
      image: lampImg,
      createdAt: Date.now(),
      exampleSentence: 'The desk lamp provided soft lighting for reading. (Lampu meja memberikan penerangan lembut untuk membaca.)',
      repetition: 0,
      easiness: 2.5,
      interval: 0,
      words: [
        {
          english: 'lampshade',
          indonesian: 'kap lampu',
          pronunciation: 'lempsyeid',
          exampleSentence: 'The metal lampshade focuses the light downwards.',
          x: 50,
          y: 32
        },
        {
          english: 'flexible arm',
          indonesian: 'tangkai fleksibel',
          pronunciation: 'fleksibel arm',
          exampleSentence: 'Adjust the height with the flexible arm.',
          x: 52,
          y: 55
        },
        {
          english: 'base switch',
          indonesian: 'sakelar di dudukan',
          pronunciation: 'beis swic',
          exampleSentence: 'Press the base switch to toggle power.',
          x: 50,
          y: 78
        }
      ]
    }
  ];

  const categories: Category[] = [
    { name: 'Garden' },
    { name: 'Kitchen' },
    { name: 'Work & Study' }
  ];

  return { cards, categories };
}
